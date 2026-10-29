import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/pricing";
import { fmtDate, orderStatusColor } from "@/lib/utils";
import { InvoiceRowActions } from "@/components/admin/InvoiceRowActions";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; type?: string }> }) {
  const sp = await searchParams;
  const where: Prisma.InvoiceWhereInput = {};
  if (sp.status) where.paymentStatus = sp.status as any;
  if (sp.type) where.type = sp.type as any;
  if (sp.q) where.OR = [{ invoiceNo: { contains: sp.q, mode: "insensitive" } }, { customer: { name: { contains: sp.q, mode: "insensitive" } } }, { customer: { company: { contains: sp.q, mode: "insensitive" } } }];
  const invoices = await prisma.invoice.findMany({ where, orderBy: { date: "desc" }, include: { customer: true }, take: 200 });
  const totals = invoices.reduce((a, i) => ({ total: a.total + i.total, tax: a.tax + i.cgst + i.sgst + i.igst, unpaid: a.unpaid + (i.paymentStatus === "PENDING" ? i.total : 0) }), { total: 0, tax: 0, unpaid: 0 });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="admin-section-title">Billing / Invoices</h1><p className="text-sm text-gray-500">{invoices.length} bills • {inr(totals.total)} • GST collected {inr(totals.tax)} • unpaid {inr(totals.unpaid)}</p></div>
        <Link href="/admin/billing/new" className="btn-primary">+ New bill</Link>
      </div>
      <form className="card mt-4 flex flex-wrap gap-2 p-3">
        <input name="q" defaultValue={sp.q} placeholder="Invoice no / customer" className="input w-full sm:w-60" />
        <select name="type" defaultValue={sp.type || ""} className="input w-full sm:w-40"><option value="">GST + Non-GST</option><option value="GST">GST only</option><option value="NON_GST">Non-GST only</option></select>
        <select name="status" defaultValue={sp.status || ""} className="input w-full sm:w-40"><option value="">Any payment</option><option value="PENDING">Unpaid</option><option value="PAID">Paid</option></select>
        <button className="btn-secondary">Filter</button>
      </form>
      <div className="card mt-4 overflow-x-auto">
        <table className="table-base min-w-[800px]"><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th className="text-center">Type</th><th className="text-right">Taxable</th><th className="text-right">GST</th><th className="text-right">Total</th><th className="text-center">Payment</th><th></th></tr></thead>
          <tbody>
            {invoices.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-gray-500">No invoices yet.</td></tr>}
            {invoices.map((i) => (
              <tr key={i.id}>
                <td><Link href={`/invoice/${i.id}`} className="font-semibold text-brand-700">{i.invoiceNo}</Link></td>
                <td className="whitespace-nowrap text-gray-500">{fmtDate(i.date)}</td>
                <td><p className="font-medium">{i.customer.company || i.customer.name}</p><p className="text-xs text-gray-500">{i.customer.phone}</p></td>
                <td className="text-center"><span className={`badge ${i.type === "GST" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>{i.type === "GST" ? "GST" : "Non-GST"}</span></td>
                <td className="text-right">{inr(i.subtotal)}</td>
                <td className="text-right">{inr(i.cgst + i.sgst + i.igst)}</td>
                <td className="text-right font-semibold">{inr(i.total)}</td>
                <td className="text-center"><span className={`badge ${orderStatusColor(i.paymentStatus)}`}>{i.paymentStatus}</span></td>
                <td><InvoiceRowActions id={i.id} paymentStatus={i.paymentStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
