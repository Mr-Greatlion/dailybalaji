import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { newOrderNo } from "@/lib/numbering";
import { round2 } from "@/lib/pricing";
import { razorpayClient } from "@/lib/razorpay";
import { notifyNewOrder } from "@/lib/orders";

export const runtime = "nodejs";

type Body = {
  items: { productId: string; qty: number }[];
  ship: { name: string; phone: string; email: string; address: string; city: string; state: string; pincode: string; gstin: string; company: string; isBusiness: boolean };
  paymentMethod: "RAZORPAY" | "COD" | "BANK_TRANSFER";
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const session = await getSession();
    if (!body.items?.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    const sh = body.ship;
    if (!sh?.name || !sh?.phone || !sh?.address || !sh?.city || !sh?.pincode) return NextResponse.json({ error: "Missing delivery details" }, { status: 400 });

    const s = await getSettings();
    const ids = body.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true } });
    if (products.length !== ids.length) return NextResponse.json({ error: "Some products are no longer available" }, { status: 400 });

    // Server-side price recompute + stock check
    let subtotal = 0;
    const lines = body.items.map((i) => {
      const p = products.find((x) => x.id === i.productId)!;
      const qty = Math.max(1, Math.floor(i.qty));
      if (p.stock < qty) throw new Error(`Only ${p.stock} of "${p.name}" available`);
      const amount = round2(p.sellPrice * qty);
      subtotal += amount;
      return { productId: p.id, name: p.name, qty, unitPrice: p.sellPrice, gstRate: p.gstRate, amount };
    });
    subtotal = round2(subtotal);
    const deliveryCharge = parseFloat(s.delivery_charge) || 0;
    const freeAbove = parseFloat(s.free_delivery_above) || 0;
    const delivery = freeAbove > 0 && subtotal >= freeAbove ? 0 : deliveryCharge;
    const minOrder = parseFloat(s.min_order) || 0;
    if (minOrder > 0 && subtotal < minOrder) return NextResponse.json({ error: `Minimum order value is ₹${minOrder}` }, { status: 400 });
    const total = round2(subtotal + delivery);

    // Upsert customer record (logged-in → linked; guest → by phone)
    let customerId: string | null = null;
    if (session) {
      const c = await prisma.customer.upsert({
        where: { userId: session.id },
        update: {
          name: sh.name, phone: sh.phone, email: sh.email || null, address: sh.address, city: sh.city, state: sh.state, pincode: sh.pincode,
          ...(sh.isBusiness ? { type: "BUSINESS", gstin: sh.gstin || null, company: sh.company || null } : {}),
        },
        create: {
          userId: session.id, name: sh.name, phone: sh.phone, email: sh.email || null, address: sh.address, city: sh.city, state: sh.state, pincode: sh.pincode,
          type: sh.isBusiness ? "BUSINESS" : "RETAIL", gstin: sh.isBusiness ? sh.gstin || null : null, company: sh.isBusiness ? sh.company || null : null,
        },
      });
      customerId = c.id;
    } else {
      const existing = await prisma.customer.findFirst({ where: { phone: sh.phone, userId: null } });
      const c = existing
        ? await prisma.customer.update({ where: { id: existing.id }, data: { name: sh.name, email: sh.email || null, address: sh.address, city: sh.city, state: sh.state, pincode: sh.pincode } })
        : await prisma.customer.create({ data: { name: sh.name, phone: sh.phone, email: sh.email || null, address: sh.address, city: sh.city, state: sh.state, pincode: sh.pincode, type: sh.isBusiness ? "BUSINESS" : "RETAIL", gstin: sh.isBusiness ? sh.gstin || null : null, company: sh.isBusiness ? sh.company || null : null } });
      customerId = c.id;
    }

    const orderNo = newOrderNo();
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNo, customerId, paymentMethod: body.paymentMethod, paymentStatus: "PENDING", status: "PENDING",
          subtotal, deliveryCharge: delivery, total,
          shipName: sh.name, shipPhone: sh.phone, shipEmail: sh.email || null, shipAddress: sh.address, shipCity: sh.city, shipState: sh.state, shipPincode: sh.pincode,
          gstin: sh.isBusiness ? sh.gstin || null : null, notes: body.notes || null,
          items: { create: lines },
        },
      });
      for (const l of lines) {
        await tx.product.update({ where: { id: l.productId }, data: { stock: { decrement: l.qty } } });
        await tx.stockMovement.create({ data: { productId: l.productId, qty: -l.qty, reason: `Order ${orderNo}`, refType: "ORDER", refId: o.id } });
      }
      return o;
    });

    let razorpay: { id: string; amount: number } | null = null;
    if (body.paymentMethod === "RAZORPAY") {
      const rzp = razorpayClient();
      if (!rzp) return NextResponse.json({ error: "Online payment is not configured" }, { status: 500 });
      const ro = await rzp.orders.create({ amount: Math.round(total * 100), currency: "INR", receipt: orderNo, notes: { orderNo } });
      await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: ro.id } });
      razorpay = { id: ro.id, amount: Number(ro.amount) };
    } else {
      notifyNewOrder(order.id);
    }

    return NextResponse.json({ ok: true, orderId: order.id, orderNo, total, razorpay });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to place order" }, { status: 400 });
  }
}
