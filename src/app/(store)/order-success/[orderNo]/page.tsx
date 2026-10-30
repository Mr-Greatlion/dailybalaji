import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { inr } from "@/lib/pricing";
import { upiQrSvg } from "@/lib/upi";

export default async function OrderSuccess({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const [order, s] = await Promise.all([prisma.order.findUnique({ where: { orderNo }, include: { items: true } }), getSettings()]);
  if (!order) notFound();
  const wa = (s.company_whatsapp || s.company_phone || "").replace(/\D/g, "").slice(-10);
  const upiQr = order.paymentStatus !== "PAID" && order.paymentMethod !== "RAZORPAY" ? await upiQrSvg({ pa: s.bank_upi, pn: s.bank_holder || s.company_name, am: order.total, tn: order.orderNo }, 160) : null;
  return (
    <div className="container-x max-w-2xl py-10">
      <div className="card p-6 text-center sm:p-10">
        <CheckCircle2 className="mx-auto h-16 w-16 text-brand-600" />
        <h1 className="mt-4 text-2xl font-bold">Order placed!</h1>
        <p className="mt-1 text-gray-600">Your order number is</p>
        <p className="text-xl font-extrabold text-brand-700">{order.orderNo}</p>
        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left text-sm">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between py-1"><span>{i.name} × {i.qty}</span><span>{inr(i.amount)}</span></div>
          ))}
          <div className="mt-2 flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{inr(order.total)}</span></div>
          <p className="mt-2 text-xs text-gray-500">
            Payment: {order.paymentMethod === "RAZORPAY" ? "Online" : order.paymentMethod === "COD" ? "Cash/UPI on delivery" : "Bank transfer"} • {order.paymentStatus}
          </p>
        </div>
        {upiQr && (
          <div className="mt-4 rounded-xl bg-white p-4 text-center ring-1 ring-brand-200">
            <p className="font-bold">Scan & Pay {inr(order.total)} via UPI</p>
            <div className="mx-auto mt-2 h-40 w-40" dangerouslySetInnerHTML={{ __html: upiQr }} />
            {s.bank_upi && <p className="mt-1 text-xs text-gray-600">UPI ID: <b>{s.bank_upi}</b></p>}
            <p className="text-xs text-gray-500">GPay · PhonePe · Paytm · BHIM — mention {order.orderNo}</p>
          </div>
        )}
        {order.paymentMethod === "BANK_TRANSFER" && (
          <div className="mt-4 rounded-xl bg-brand-50 p-4 text-left text-sm">
            <p className="font-bold">Transfer to:</p>
            <p>{s.bank_holder}</p>
            <p>{s.bank_name}, {s.bank_branch}</p>
            {s.bank_account && <p>A/c No: <b>{s.bank_account}</b></p>}
            <p>IFSC: <b>{s.bank_ifsc}</b></p>
            <p className="mt-1 text-xs text-gray-600">Mention order no. {order.orderNo} in the remark. We dispatch once payment is received.</p>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/account/orders" className="btn-primary">Track order</Link>
          {wa && <a className="btn-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/91${wa}?text=${encodeURIComponent(`Hi, I placed order ${order.orderNo} on your website.`)}`}>WhatsApp us</a>}
          <Link href="/shop" className="btn-ghost">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
