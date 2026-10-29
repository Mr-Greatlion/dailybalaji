import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { notifyNewOrder } from "@/lib/orders";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.razorpayOrderId !== razorpay_order_id) return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "FAILED" } });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", status: "CONFIRMED", razorpayPaymentId: razorpay_payment_id } });
  notifyNewOrder(orderId);
  return NextResponse.json({ ok: true });
}
