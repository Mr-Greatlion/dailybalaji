import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/pricing";
import { fmtDateTime, orderStatusColor } from "@/lib/utils";
import { OrderAdminActions } from "@/components/admin/OrderAdminActions";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await prisma.order.findUnique({ where: { id }, include: { items: true, invoice: true, customer: true } });
  if (!o) notFound();
  const wa = o.shipPhone.replace(/\D/g, "").slice(-10);
  return (
    <div className="max-w-4xl">
      <Link href="/admin/orders" className="text-sm text-brand-700">← Orders</Link>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="admin-section-title">{o.orderNo}</h1><p className="text-sm text-gray-500">{fmtDateTime(o.createdAt)}</p></div>
        <div className="flex gap-2"><span className={`badge ${orderStatusColor(o.status)}`}>{o.status}</span><span className={`badge ${orderStatusColor(o.paymentStatus)}`}>{o.paymentStatus}</span></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card overflow-x-auto">
            <table className="table-base"><thead><tr><th>Item</th><th className="text-center">Qty</th><th className="text-right">Rate</th><th className="text-right">Amount</th></tr></thead>
              <tbody>{o.items.map((i) => <tr key={i.id}><td>{i.name}</td><td className="text-center">{i.qty}</td><td className="text-right">{inr(i.unitPrice)}</td><td className="text-right">{inr(i.amount)}</td></tr>)}</tbody>
              <tfoot><tr><td colSpan={3} className="text-right text-gray-600">Subtotal</td><td className="text-right">{inr(o.subtotal)}</td></tr><tr><td colSpan={3} className="text-right text-gray-600">Delivery</td><td className="text-right">{inr(o.deliveryCharge)}</td></tr><tr className="font-bold"><td colSpan={3} className="text-right">Total</td><td className="text-right">{inr(o.total)}</td></tr></tfoot>
            </table>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-4 text-sm">
              <p className="label">Deliver to</p>
              <p className="font-semibold">{o.shipName}</p><p>{o.shipAddress}</p><p>{o.shipCity} - {o.shipPincode}, {o.shipState}</p>
              <p className="mt-1">📞 <a href={`tel:${o.shipPhone}`} className="text-brand-700">{o.shipPhone}</a> • <a href={`https://wa.me/91${wa}`} target="_blank" rel="noreferrer" className="text-brand-700">WhatsApp</a></p>
              {o.shipEmail && <p>✉ {o.shipEmail}</p>}
              {o.gstin && <p className="mt-1 font-semibold">GSTIN: {o.gstin}</p>}
              {o.notes && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs">📝 {o.notes}</p>}
            </div>
            <div className="card p-4 text-sm">
              <p className="label">Payment</p>
              <p>{o.paymentMethod === "RAZORPAY" ? "Online (Razorpay)" : o.paymentMethod === "COD" ? "Cash / UPI on delivery" : "Bank transfer"}</p>
              {o.razorpayPaymentId && <p className="text-xs text-gray-500">Payment ID: {o.razorpayPaymentId}</p>}
              <p className="label mt-3">Invoice</p>
              {o.invoice ? <Link href={`/invoice/${o.invoice.id}`} className="btn-secondary mt-1">View {o.invoice.invoiceNo}</Link> : <p className="text-gray-500">Not generated yet</p>}
            </div>
          </div>
        </div>
        <OrderAdminActions id={o.id} status={o.status} paymentStatus={o.paymentStatus} hasInvoice={!!o.invoice} isBusiness={!!o.gstin} />
      </div>
    </div>
  );
}
