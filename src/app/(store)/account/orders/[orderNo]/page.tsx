import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fmtDateTime, orderStatusColor } from "@/lib/utils";
import { inr } from "@/lib/pricing";

const STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

export default async function OrderDetail({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  const customer = await prisma.customer.findUnique({ where: { userId: session.id } });
  const o = await prisma.order.findUnique({ where: { orderNo }, include: { items: true, invoice: { select: { id: true, invoiceNo: true } } } });
  if (!o || (session.role !== "ADMIN" && o.customerId !== customer?.id)) notFound();
  const stepIdx = STEPS.indexOf(o.status);

  return (
    <div className="container-x max-w-3xl py-6">
      <Link href="/account/orders" className="text-sm text-brand-700">← All orders</Link>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold">{o.orderNo}</h1><p className="text-sm text-gray-500">{fmtDateTime(o.createdAt)}</p></div>
        <span className={`badge ${orderStatusColor(o.status)}`}>{o.status}</span>
      </div>

      {o.status !== "CANCELLED" && (
        <div className="card mt-5 p-4">
          <div className="flex items-center justify-between">
            {STEPS.map((st, i) => (
              <div key={st} className="flex flex-1 flex-col items-center text-center">
                <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i <= stepIdx ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</div>
                <p className={`mt-1 text-[10px] font-semibold sm:text-xs ${i <= stepIdx ? "text-brand-700" : "text-gray-400"}`}>{st.charAt(0) + st.slice(1).toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-4 divide-y">
        {o.items.map((i) => (
          <div key={i.id} className="flex justify-between p-4 text-sm"><span>{i.name} × {i.qty}</span><span className="font-medium">{inr(i.amount)}</span></div>
        ))}
        <div className="space-y-1 p-4 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{inr(o.subtotal)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{inr(o.deliveryCharge)}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span>{inr(o.total)}</span></div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card p-4 text-sm"><p className="label">Delivery address</p><p className="font-semibold">{o.shipName}</p><p>{o.shipAddress}</p><p>{o.shipCity} - {o.shipPincode}, {o.shipState}</p><p>Ph: {o.shipPhone}</p></div>
        <div className="card p-4 text-sm">
          <p className="label">Payment</p>
          <p>{o.paymentMethod === "RAZORPAY" ? "Online" : o.paymentMethod === "COD" ? "Cash/UPI on delivery" : "Bank transfer"} • <span className={`badge ${orderStatusColor(o.paymentStatus)}`}>{o.paymentStatus}</span></p>
          {o.gstin && <p className="mt-2 text-xs">GSTIN: {o.gstin}</p>}
          {o.invoice && <Link href={`/invoice/${o.invoice.id}`} className="btn-secondary mt-3">View invoice {o.invoice.invoiceNo}</Link>}
        </div>
      </div>
    </div>
  );
}
