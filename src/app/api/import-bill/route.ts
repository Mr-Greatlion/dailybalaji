import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { effectiveSellPrice, round2 } from "@/lib/pricing";
import { nextPurchaseNo } from "@/lib/numbering";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-time import of Parag Milk Foods invoice 7395002844 (21-10-2026).
 * GET /api/import-bill?key=<AUTH_SECRET>
 * Idempotent: products matched by SKU, purchase matched by bill number.
 *
 * Pricing rule: sell = dealer price + 10% (GST on the profit is inside the 10%).
 * Engine: sell = L + L*m% + (L*m%)*gst%.  For 5% GST items m = 9.5238 → exactly +10%.  For 0% GST m = 10.
 */
const MARGIN_5 = 9.5238;
const MARGIN_0 = 10;

const BILL = {
  vendor: { name: "Parag Milk Foods Ltd", gstin: "33AABCP0425G1Z0", phone: "18001024700", address: "C/O Snowman Logistics Ltd, No.54 Mevalurkuppam, Thandalam, Kanchipuram 602105", city: "Kanchipuram", state: "Tamil Nadu" },
  billNo: "7395002844",
  billDate: "2026-10-21",
  lines: [
    { sku: "GO-CS-800", image: "/products/go-cheese-slices-800g.jpg", name: "Go Cheese Slices 800 g (750 g + 50 g extra)", category: "Cheese", hsn: "04062000", packSize: "800 g pack", gst: 5, boxes: 7, perBox: 12, boxTotalInclGst: 30202.2, mrp: 510, desc: "Go processed cheese slices by Parag Milk Foods — 750 g pack with 50 g extra free. Ideal for sandwiches, burgers and toasts. Keep refrigerated." },
    { sku: "GOW-GHEE-PP-1L", image: "/products/gow-ghee-1l.jpg", name: "Gowardhan Pure Cow Ghee 1 L (PP pack)", category: "Ghee & Butter", hsn: "04059020", packSize: "1 L pack", gst: 5, boxes: 2, perBox: 10, boxTotalInclGst: 12722.39, mrp: 930, desc: "Gowardhan pure cow ghee, 1 litre PP pack. Rich aroma and granular texture, made from fresh cow milk." },
    { sku: "GOW-PANEER-200", image: "/products/gow-paneer-200g.jpg", name: "Gowardhan Fresh Paneer Block 200 g", category: "Paneer", hsn: "04069000", packSize: "200 g block", gst: 0, boxes: 1, perBox: 24, boxTotalInclGst: 2044.2, mrp: 135, desc: "Gowardhan fresh paneer block, 200 g. Soft, high-protein, ready to cook. Keep refrigerated and use before expiry." },
    { sku: "GOW-GHEE-JAR-1L", image: "/products/gow-ghee-1l.jpg", name: "Gowardhan Pure Cow Ghee 1 L (Jar)", category: "Ghee & Butter", hsn: "04059020", packSize: "1 L jar", gst: 5, boxes: 2, perBox: 18, boxTotalInclGst: 23515.91, mrp: 955, desc: "Gowardhan pure cow ghee in a convenient 1 litre jar. Rich aroma and granular texture." },
    { sku: "GO-MOZZ-2KG", image: "/products/go-mozzarella-shredded-2kg.jpg", name: "Go Mozzarella Cheese Shredded 2 kg", category: "Cheese", hsn: "04062000", packSize: "2 kg pack", gst: 5, boxes: 1, perBox: 6, boxTotalInclGst: 5076.01, mrp: 1200, desc: "Go shredded mozzarella cheese, 2 kg catering pack. Perfect melt and stretch for pizzas, pastas and bakes." },
  ],
  extras: [
    { sku: "GO-CS-100MM", image: "/products/go-cheese-slices-100mm.jpg", name: "Go Cheese Slices 100 mm PP", category: "Cheese", hsn: "04062000", packSize: "pack", gst: 5, desc: "Go processed cheese slices, 100 mm PP pack. Ideal for burgers and sandwiches." },
    { sku: "GO-MOZZ-BLOCK-200", image: "/products/go-mozzarella-block-200g.jpg", name: "Go Mozzarella Cheese Block 200 g", category: "Cheese", hsn: "04062000", packSize: "200 g block", gst: 5, desc: "Go mozzarella cheese block, 200 g. Great melt for pizzas and pastas." },
    { sku: "GO-SPREAD-1KG", image: "/products/go-cheese-spread-1kg.jpg", name: "Go Cheese Spread 1 kg Jar", category: "Cheese", hsn: "04062000", packSize: "1 kg jar", gst: 5, desc: "Go creamy cheese spread, 1 kg jar. Spread on bread, crackers and sandwiches." },
  ],
};

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.AUTH_SECRET || key !== process.env.AUTH_SECRET) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const log: string[] = [];
    // margin
    await prisma.setting.upsert({ where: { key: "margin_percent" }, update: { value: String(MARGIN_5) }, create: { key: "margin_percent", value: String(MARGIN_5) } });

    // vendor
    let vendor = await prisma.vendor.findFirst({ where: { name: { contains: "Parag", mode: "insensitive" } } });
    if (!vendor) vendor = await prisma.vendor.create({ data: { ...BILL.vendor } });
    else vendor = await prisma.vendor.update({ where: { id: vendor.id }, data: { name: BILL.vendor.name, gstin: BILL.vendor.gstin, phone: BILL.vendor.phone, address: BILL.vendor.address, city: BILL.vendor.city, state: BILL.vendor.state } });

    // categories
    const cats: Record<string, string> = {};
    for (const name of ["Cheese", "Ghee & Butter", "Paneer"]) {
      const slug = slugify(name);
      const c = await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
      cats[name] = c.id;
    }

    // products
    const rows: any[] = [];
    const purchaseLines: { productId: string; qty: number; rate: number; gstRate: number; amount: number }[] = [];
    for (const l of BILL.lines) {
      const qty = l.boxes * l.perBox;
      const dbLanding = round2(l.boxTotalInclGst / qty);
      const marginPercent = l.gst === 0 ? MARGIN_0 : MARGIN_5;
      const sellPrice = effectiveSellPrice({ dbLanding, gstRate: l.gst, marginPercent, priceOverride: null }, MARGIN_5);
      let p = await prisma.product.findFirst({ where: { sku: l.sku } });
      const data = { name: l.name, sku: l.sku, hsn: l.hsn, description: l.desc, categoryId: cats[l.category], vendorId: vendor.id, unit: "pc", packSize: l.packSize, images: [l.image], dbLanding, gstRate: l.gst, marginPercent, sellPrice, mrp: l.mrp, lowStockAt: Math.max(3, Math.round(l.perBox / 2)), isActive: true, isFeatured: true };
      if (!p) {
        let slug = slugify(l.name);
        if (await prisma.product.findUnique({ where: { slug } })) slug = `${slug}-${l.sku.toLowerCase()}`;
        p = await prisma.product.create({ data: { ...data, slug, stock: 0 } });
        log.push(`product created: ${l.name}`);
      } else {
        p = await prisma.product.update({ where: { id: p.id }, data });
        log.push(`product updated: ${l.name}`);
      }
      purchaseLines.push({ productId: p.id, qty, rate: dbLanding, gstRate: l.gst, amount: round2(dbLanding * qty) });
      rows.push({ product: l.name, pieces: qty, dealerPerPiece: dbLanding, sellPerPiece: sellPrice, profitPerPiece: round2(sellPrice - dbLanding), mrp: l.mrp, gst: l.gst });
    }

    // extra catalogue items (hidden until a dealer price is entered in admin)
    for (const x of BILL.extras) {
      if (await prisma.product.findFirst({ where: { sku: x.sku } })) continue;
      let slug = slugify(x.name);
      if (await prisma.product.findUnique({ where: { slug } })) slug = `${slug}-${x.sku.toLowerCase()}`;
      await prisma.product.create({ data: { name: x.name, slug, sku: x.sku, hsn: x.hsn, description: x.desc, categoryId: cats[x.category], vendorId: vendor.id, unit: "pc", packSize: x.packSize, images: [x.image], gstRate: x.gst, marginPercent: MARGIN_5, dbLanding: 0, sellPrice: 0, stock: 0, isActive: false, isFeatured: false } });
      log.push(`catalogue item added (hidden, no price yet): ${x.name}`);
    }

    // purchase entry + stock (once)
    const existing = await prisma.purchase.findFirst({ where: { billNo: BILL.billNo } });
    if (existing) {
      log.push(`purchase ${existing.purchaseNo} already recorded for bill ${BILL.billNo} — stock not added again`);
    } else {
      let subtotal = 0, gstTotal = 0, total = 0;
      for (const pl of purchaseLines) { const taxable = round2(pl.amount / (1 + pl.gstRate / 100)); subtotal += taxable; gstTotal += pl.amount - taxable; total += pl.amount; }
      const purchaseNo = await nextPurchaseNo();
      await prisma.$transaction(async (tx) => {
        const pur = await tx.purchase.create({ data: { purchaseNo, vendorId: vendor!.id, billNo: BILL.billNo, billDate: new Date(BILL.billDate), notes: "Parag Milk Foods tax invoice — imported", subtotal: round2(subtotal), gstTotal: round2(gstTotal), total: round2(total), items: { create: purchaseLines } } });
        for (const pl of purchaseLines) {
          await tx.product.update({ where: { id: pl.productId }, data: { stock: { increment: pl.qty } } });
          await tx.stockMovement.create({ data: { productId: pl.productId, qty: pl.qty, reason: `Purchase ${purchaseNo} (bill ${BILL.billNo})`, refType: "PURCHASE", refId: pur.id } });
        }
      });
      log.push(`purchase ${purchaseNo} created, total ₹${round2(total)}, stock added`);
    }

    return NextResponse.json({ ok: true, marginPercent: MARGIN_5, rule: "sell = dealer price + 10% (GST on profit inside)", products: rows, log });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
