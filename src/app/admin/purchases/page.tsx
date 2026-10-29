import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/pricing";
import { fmtDate } from "@/lib/utils";

export default async function PurchasesPage() {
  const purchases = await prisma.purchase.findMany({ orderBy: { billDate: "desc" }, include: { vendor: true, items: true } });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="admin-section-title">Purchases</h1><p className="text-sm text-gray-500">Dealer bills entered here add stock and update dealer prices automatically.</p></div>
        <Link href="/admin/purchases/new" className="btn-primary">+ New purchase entry</Link>
      </div>
      <div className="card mt-4 overflow-x-auto">
        <table className="table-base min-w-[700px]"><thead><tr><th>Purchase no</th><th>Vendor</th><th>Bill no / date</th><th className="text-center">Items</th><th className="text-right">GST</th><th className="text-right">Total</th><th></th></tr></thead>
          <tbody>
            {purchases.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">No purchases recorded yet.</td></tr>}
            {purchases.map((p) => (
              <tr key={p.id}>
                <td className="font-semibold">{p.purchaseNo}</td>
                <td>{p.vendor.name}</td>
                <td className="text-sm">{p.billNo || "-"} <span className="text-gray-500">• {fmtDate(p.billDate)}</span></td>
                <td className="text-center">{p.items.reduce((a, b) => a + b.qty, 0)}</td>
                <td className="text-right">{inr(p.gstTotal)}</td>
                <td className="text-right font-semibold">{inr(p.total)}</td>
                <td className="text-right"><Link href={`/admin/purchases/${p.id}`} className="text-sm text-brand-700">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
