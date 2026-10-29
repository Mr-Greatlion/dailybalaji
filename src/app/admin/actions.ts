"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getMargin, setSettings } from "@/lib/settings";
import { effectiveSellPrice, buildInvoiceTotals, round2 } from "@/lib/pricing";
import { nextInvoiceNo, nextPurchaseNo } from "@/lib/numbering";
import { notifyOrderStatus } from "@/lib/orders";
import { slugify, num, int, str, optStr } from "@/lib/utils";

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugify(base) || "item";
  let i = 1;
  while (true) {
    const ex = await prisma.product.findUnique({ where: { slug } });
    if (!ex || ex.id === excludeId) return slug;
    slug = `${slugify(base)}-${++i}`;
  }
}

/* ---------------- Categories ---------------- */
export async function saveCategory(fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = optStr(fd.get("id"));
  const name = str(fd.get("name"));
  if (!name) return { ok: false, error: "Name required" };
  let slug = slugify(name);
  const clash = await prisma.category.findUnique({ where: { slug } });
  if (clash && clash.id !== id) slug = `${slug}-${Date.now().toString(36)}`;
  const data = { name, slug, image: optStr(fd.get("image")), sortOrder: int(fd.get("sortOrder")) };
  if (id) await prisma.category.update({ where: { id }, data });
  else await prisma.category.create({ data });
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { ok: true };
}

/* ---------------- Products ---------------- */
export async function saveProduct(fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = optStr(fd.get("id"));
  const name = str(fd.get("name"));
  if (!name) return { ok: false, error: "Product name required" };
  const margin = await getMargin();
  const dbLanding = num(fd.get("dbLanding"));
  const gstRate = num(fd.get("gstRate"), 5);
  const marginPercentRaw = str(fd.get("marginPercent"));
  const marginPercent = marginPercentRaw === "" ? null : num(fd.get("marginPercent"));
  const priceOverrideRaw = str(fd.get("priceOverride"));
  const priceOverride = priceOverrideRaw === "" ? null : num(fd.get("priceOverride"));
  const sellPrice = effectiveSellPrice({ dbLanding, gstRate, marginPercent, priceOverride }, margin);
  const images = str(fd.get("images")).split("\n").map((s) => s.trim()).filter(Boolean);
  const data = {
    name,
    slug: await uniqueSlug(str(fd.get("slug")) || name, id ?? undefined),
    sku: optStr(fd.get("sku")),
    hsn: optStr(fd.get("hsn")),
    description: str(fd.get("description")),
    categoryId: optStr(fd.get("categoryId")),
    vendorId: optStr(fd.get("vendorId")),
    unit: str(fd.get("unit")) || "pc",
    packSize: optStr(fd.get("packSize")),
    images,
    dbLanding, gstRate, marginPercent, priceOverride, sellPrice,
    mrp: str(fd.get("mrp")) === "" ? null : num(fd.get("mrp")),
    lowStockAt: int(fd.get("lowStockAt"), 5),
    isActive: fd.get("isActive") === "on",
    isFeatured: fd.get("isFeatured") === "on",
  };
  let pid = id;
  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    const stock = int(fd.get("stock"));
    const p = await prisma.product.create({ data: { ...data, stock } });
    pid = p.id;
    if (stock) await prisma.stockMovement.create({ data: { productId: p.id, qty: stock, reason: "Opening stock" } });
  }
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
  return { ok: true, id: pid! };
}

export async function deleteProduct(id: string): Promise<Result> {
  await requireAdmin();
  const used = await prisma.orderItem.count({ where: { productId: id } });
  if (used) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/products");
    return { ok: false, error: "Product has orders; it was deactivated instead of deleted." };
  }
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function toggleProduct(id: string, field: "isActive" | "isFeatured", value: boolean): Promise<Result> {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { [field]: value } });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true };
}

/** Recompute every product's sell price from DB landing + current margin (skips manual overrides). */
export async function recomputeAllPrices(): Promise<Result> {
  await requireAdmin();
  const margin = await getMargin();
  const products = await prisma.product.findMany();
  await prisma.$transaction(products.map((p) => prisma.product.update({ where: { id: p.id }, data: { sellPrice: effectiveSellPrice(p, margin) } })));
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true };
}

/* ---------------- Inventory ---------------- */
export async function adjustStock(fd: FormData): Promise<Result> {
  await requireAdmin();
  const productId = str(fd.get("productId"));
  const qty = int(fd.get("qty"));
  const reason = str(fd.get("reason")) || "Manual adjustment";
  if (!productId || !qty) return { ok: false, error: "Product and non-zero quantity required" };
  await prisma.$transaction([
    prisma.product.update({ where: { id: productId }, data: { stock: { increment: qty } } }),
    prisma.stockMovement.create({ data: { productId, qty, reason, refType: "ADJUST" } }),
  ]);
  revalidatePath("/admin/inventory");
  return { ok: true };
}

/* ---------------- Vendors ---------------- */
export async function saveVendor(fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = optStr(fd.get("id"));
  const name = str(fd.get("name"));
  if (!name) return { ok: false, error: "Vendor name required" };
  const data = {
    name, contact: optStr(fd.get("contact")), phone: str(fd.get("phone")), email: optStr(fd.get("email")), gstin: optStr(fd.get("gstin"))?.toUpperCase() ?? null,
    address: str(fd.get("address")), city: str(fd.get("city")), state: str(fd.get("state")) || "Tamil Nadu", pincode: str(fd.get("pincode")), notes: optStr(fd.get("notes")),
  };
  if (id) await prisma.vendor.update({ where: { id }, data });
  else await prisma.vendor.create({ data });
  revalidatePath("/admin/vendors");
  return { ok: true };
}

export async function deleteVendor(id: string): Promise<Result> {
  await requireAdmin();
  const n = await prisma.purchase.count({ where: { vendorId: id } });
  if (n) return { ok: false, error: "Vendor has purchase records and cannot be deleted." };
  await prisma.vendor.delete({ where: { id } });
  revalidatePath("/admin/vendors");
  return { ok: true };
}

/* ---------------- Customers ---------------- */
export async function saveCustomer(fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = optStr(fd.get("id"));
  const name = str(fd.get("name"));
  const phone = str(fd.get("phone"));
  if (!name || !phone) return { ok: false, error: "Name and phone required" };
  const type = fd.get("type") === "BUSINESS" ? "BUSINESS" : "RETAIL";
  const data = {
    name, phone, email: optStr(fd.get("email")), type: type as "BUSINESS" | "RETAIL",
    company: type === "BUSINESS" ? optStr(fd.get("company")) : null,
    gstin: type === "BUSINESS" ? optStr(fd.get("gstin"))?.toUpperCase() ?? null : null,
    address: str(fd.get("address")), city: str(fd.get("city")) || "Chennai", state: str(fd.get("state")) || "Tamil Nadu", pincode: str(fd.get("pincode")), notes: optStr(fd.get("notes")),
  };
  let cid = id;
  if (id) await prisma.customer.update({ where: { id }, data });
  else cid = (await prisma.customer.create({ data })).id;
  revalidatePath("/admin/customers");
  return { ok: true, id: cid! };
}

export async function deleteCustomer(id: string): Promise<Result> {
  await requireAdmin();
  const n = (await prisma.invoice.count({ where: { customerId: id } })) + (await prisma.order.count({ where: { customerId: id } }));
  if (n) return { ok: false, error: "Customer has invoices/orders and cannot be deleted." };
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/admin/customers");
  return { ok: true };
}

/* ---------------- Purchases (stock in from vendor) ---------------- */
export type PurchaseLine = { productId: string; qty: number; rate: number; gstRate: number };

export async function createPurchase(input: { vendorId: string; billNo: string; billDate: string; notes: string; lines: PurchaseLine[]; updateLanding: boolean }): Promise<Result> {
  await requireAdmin();
  if (!input.vendorId) return { ok: false, error: "Select a vendor" };
  const lines = input.lines.filter((l) => l.productId && l.qty > 0);
  if (!lines.length) return { ok: false, error: "Add at least one item" };
  const margin = await getMargin();
  let subtotal = 0, gstTotal = 0, total = 0;
  const items = lines.map((l) => {
    const amount = round2(l.qty * l.rate);
    const taxable = round2(amount / (1 + l.gstRate / 100));
    subtotal += taxable; gstTotal += amount - taxable; total += amount;
    return { ...l, amount };
  });
  const purchaseNo = await nextPurchaseNo();
  const p = await prisma.$transaction(async (tx) => {
    const pur = await tx.purchase.create({
      data: { purchaseNo, vendorId: input.vendorId, billNo: input.billNo || null, billDate: input.billDate ? new Date(input.billDate) : new Date(), notes: input.notes || null, subtotal: round2(subtotal), gstTotal: round2(gstTotal), total: round2(total), items: { create: items } },
    });
    for (const l of items) {
      const prod = await tx.product.findUnique({ where: { id: l.productId } });
      if (!prod) continue;
      const data: Record<string, unknown> = { stock: { increment: l.qty } };
      if (input.updateLanding) {
        data.dbLanding = l.rate;
        data.gstRate = l.gstRate;
        data.sellPrice = effectiveSellPrice({ ...prod, dbLanding: l.rate, gstRate: l.gstRate }, margin);
        if (!prod.vendorId) data.vendorId = input.vendorId;
      }
      await tx.product.update({ where: { id: l.productId }, data });
      await tx.stockMovement.create({ data: { productId: l.productId, qty: l.qty, reason: `Purchase ${purchaseNo}`, refType: "PURCHASE", refId: pur.id } });
    }
    return pur;
  });
  revalidatePath("/admin/purchases");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  return { ok: true, id: p.id };
}

/* ---------------- Invoices / Billing ---------------- */
export type InvoiceLineInput = { productId: string | null; name: string; hsn: string; unit: string; qty: number; unitPrice: number; gstRate: number };

export async function createInvoice(input: {
  customerId: string; type: "GST" | "NON_GST"; date: string; paymentStatus: "PENDING" | "PAID"; paymentMethod: "COD" | "BANK_TRANSFER" | "RAZORPAY";
  notes: string; lines: InvoiceLineInput[]; deductStock: boolean; orderId?: string | null;
}): Promise<Result> {
  await requireAdmin();
  if (!input.customerId) return { ok: false, error: "Select a customer" };
  const lines = input.lines.filter((l) => l.name && l.qty > 0);
  if (!lines.length) return { ok: false, error: "Add at least one item" };
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) return { ok: false, error: "Customer not found" };
  const companyState = (await prisma.setting.findUnique({ where: { key: "company_state" } }))?.value || "Tamil Nadu";
  const intra = customer.state.trim().toLowerCase() === companyState.trim().toLowerCase();
  const totals = buildInvoiceTotals(lines.map((l) => ({ unitPrice: l.unitPrice, qty: l.qty, gstRate: input.type === "GST" ? l.gstRate : 0 })), input.type, intra);
  const invoiceNo = await nextInvoiceNo();

  const inv = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        invoiceNo, type: input.type, customerId: input.customerId, date: input.date ? new Date(input.date) : new Date(),
        subtotal: totals.subtotal, cgst: totals.cgst, sgst: totals.sgst, igst: totals.igst, roundOff: totals.roundOff, total: totals.total,
        paymentStatus: input.paymentStatus, paymentMethod: input.paymentMethod, notes: input.notes || null, orderId: input.orderId || null,
        items: { create: lines.map((l, i) => ({ productId: l.productId, name: l.name, hsn: l.hsn || null, unit: l.unit || "pc", qty: l.qty, unitPrice: l.unitPrice, gstRate: input.type === "GST" ? l.gstRate : 0, taxable: totals.items[i].taxable, tax: totals.items[i].tax, amount: totals.items[i].amount })) },
      },
    });
    if (input.deductStock) {
      for (const l of lines) {
        if (!l.productId) continue;
        await tx.product.update({ where: { id: l.productId }, data: { stock: { decrement: l.qty } } });
        await tx.stockMovement.create({ data: { productId: l.productId, qty: -l.qty, reason: `Invoice ${invoiceNo}`, refType: "INVOICE", refId: created.id } });
      }
    }
    return created;
  });
  revalidatePath("/admin/billing");
  revalidatePath("/admin/inventory");
  return { ok: true, id: inv.id };
}

export async function setInvoicePayment(id: string, status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"): Promise<Result> {
  await requireAdmin();
  await prisma.invoice.update({ where: { id }, data: { paymentStatus: status } });
  revalidatePath("/admin/billing");
  return { ok: true };
}

export async function deleteInvoice(id: string): Promise<Result> {
  await requireAdmin();
  const inv = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!inv) return { ok: false, error: "Not found" };
  await prisma.$transaction(async (tx) => {
    const moves = await tx.stockMovement.findMany({ where: { refType: "INVOICE", refId: id } });
    for (const m of moves) await tx.product.update({ where: { id: m.productId }, data: { stock: { increment: -m.qty } } });
    await tx.stockMovement.deleteMany({ where: { refType: "INVOICE", refId: id } });
    await tx.invoice.delete({ where: { id } });
  });
  revalidatePath("/admin/billing");
  return { ok: true };
}

/* ---------------- Orders ---------------- */
export async function updateOrder(id: string, data: { status?: string; paymentStatus?: string }): Promise<Result> {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return { ok: false, error: "Order not found" };
  const prevStatus = order.status;
  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: (data.status as any) ?? undefined, paymentStatus: (data.paymentStatus as any) ?? undefined } });
    // Restore stock on cancel; re-deduct if un-cancelled
    if (data.status === "CANCELLED" && prevStatus !== "CANCELLED") {
      for (const it of order.items) {
        await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.qty } } });
        await tx.stockMovement.create({ data: { productId: it.productId, qty: it.qty, reason: `Order ${order.orderNo} cancelled`, refType: "ORDER", refId: id } });
      }
    } else if (prevStatus === "CANCELLED" && data.status && data.status !== "CANCELLED") {
      for (const it of order.items) {
        await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.qty } } });
        await tx.stockMovement.create({ data: { productId: it.productId, qty: -it.qty, reason: `Order ${order.orderNo} reinstated`, refType: "ORDER", refId: id } });
      }
    }
  });
  if (data.status && data.status !== prevStatus) notifyOrderStatus(id);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}

/** Generate an invoice from an order (stock already deducted at order time). */
export async function invoiceFromOrder(orderId: string, type: "GST" | "NON_GST"): Promise<Result> {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } }, invoice: true, customer: true } });
  if (!order) return { ok: false, error: "Order not found" };
  if (order.invoice) return { ok: true, id: order.invoice.id };
  let customerId = order.customerId;
  if (!customerId) {
    const c = await prisma.customer.create({ data: { name: order.shipName, phone: order.shipPhone, email: order.shipEmail, address: order.shipAddress, city: order.shipCity, state: order.shipState, pincode: order.shipPincode, type: order.gstin ? "BUSINESS" : "RETAIL", gstin: order.gstin } });
    customerId = c.id;
  }
  const lines: InvoiceLineInput[] = order.items.map((it) => ({ productId: it.productId, name: it.name, hsn: it.product?.hsn || "", unit: it.product?.unit || "pc", qty: it.qty, unitPrice: it.unitPrice, gstRate: it.gstRate }));
  if (order.deliveryCharge > 0) lines.push({ productId: null, name: "Delivery charges", hsn: "996812", unit: "pc", qty: 1, unitPrice: order.deliveryCharge, gstRate: 0 });
  const res = await createInvoice({
    customerId, type, date: new Date().toISOString(), paymentStatus: order.paymentStatus === "PAID" ? "PAID" : "PENDING",
    paymentMethod: order.paymentMethod, notes: `Order ${order.orderNo}`, lines, deductStock: false, orderId,
  });
  revalidatePath(`/admin/orders/${orderId}`);
  return res;
}

/* ---------------- Settings ---------------- */
export async function saveSettings(fd: FormData): Promise<Result> {
  await requireAdmin();
  const values: Record<string, string> = {};
  fd.forEach((v, k) => { if (!k.startsWith("$")) values[k] = String(v); });
  const prevMargin = await getMargin();
  await setSettings(values);
  const newMargin = parseFloat(values.margin_percent);
  if (!isNaN(newMargin) && newMargin !== prevMargin) await recomputeAllPrices();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changeAdminPassword(fd: FormData): Promise<Result> {
  const s = await requireAdmin();
  const pw = str(fd.get("password"));
  if (pw.length < 6) return { ok: false, error: "Min 6 characters" };
  const { hashPassword } = await import("@/lib/auth");
  await prisma.user.update({ where: { id: s.id }, data: { password: await hashPassword(pw) } });
  return { ok: true };
}

export async function gotoProduct(id: string) {
  redirect(`/admin/products/${id}`);
}
