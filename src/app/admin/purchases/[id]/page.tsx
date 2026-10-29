import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/pricing";
import { fmtDate } from "@/lib/utils";

export default async function PurchaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.purchase.findUnique({ where: { id }, include: { vendor: true, items: { include: { product: true } } } });
  if (!p) notFound();
  return (
    <div className="max-w-3xl">
      <Link href="/admin/purchases" className="text-sm text-brand-700">← Purchases</Link>
      <h1 className="admin-section-title mt-1">{p.purchaseNo}</h1>
      <div className="card mt-4 p-5 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><p className="label">Vendor</p><p className="font-semibold">{p.vendor.name}</p><p className="text-gray-500">{p.vendor.gstin}</p></div>
          <div><p className="label">Dealer bill</p><p>{p.billNo || "-"} • {fmtDate(p.billDate)}</p></div>
        </div>
        {p.notes && <p className="mt-3 text-gray-600">{p.notes}</p>}
      </div>
      <div className="card mt-4 overflow-x-auto">
        <table className="table-base"><thead><tr><th>Product</th><th className="text-center">Qty</th><th className="text-right">Rate (incl GST)</th><th className="text-center">GST</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{p.items.map((it) => <tr key={it.id}><td>{it.product.name}</td><td className="text-center">{it.qty}</td><td className="text-right">{inr(it.rate)}</td><td className="text-center">{it.gstRate}%</td><td className="text-right">{inr(it.amount)}</td></tr>)}</tbody>
          <tfoot><tr><td colSpan={4} className="text-right text-gray-600">Taxable</td><td className="text-right">{inr(p.subtotal)}</td></tr><tr><td colSpan={4} className="text-right text-gray-600">GST (input credit)</td><td className="text-right">{inr(p.gstTotal)}</td></tr><tr className="font-bold"><td colSpan={4} className="text-right">Total</td><td className="text-right">{inr(p.total)}</td></tr></tfoot>
        </table>
      </div>
    </div>
  );
}
