import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/pricing";
import { fmtDateTime } from "@/lib/utils";
import { StockAdjustForm } from "@/components/admin/StockAdjustForm";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ low?: string; q?: string }> }) {
  const sp = await searchParams;
  const [products, movements] = await Promise.all([
    prisma.product.findMany({ where: sp.q ? { name: { contains: sp.q, mode: "insensitive" } } : undefined, orderBy: { name: "asc" }, include: { category: { select: { name: true } } } }),
    prisma.stockMovement.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { product: { select: { name: true } } } }),
  ]);
  const list = sp.low ? products.filter((p) => p.stock <= p.lowStockAt) : products;
  const stockValue = products.reduce((a, p) => a + p.stock * p.dbLanding, 0);
  const saleValue = products.reduce((a, p) => a + p.stock * p.sellPrice, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="admin-section-title">Inventory</h1><p className="text-sm text-gray-500">Stock on hand • cost value {inr(stockValue)} • sale value {inr(saleValue)}</p></div>
        <Link href="/admin/purchases/new" className="btn-primary">+ Stock in (purchase)</Link>
      </div>
      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <form className="flex gap-2">
            <input name="q" defaultValue={sp.q} placeholder="Search product" className="input" />
            <label className="flex shrink-0 items-center gap-2 text-sm"><input type="checkbox" name="low" value="1" defaultChecked={!!sp.low} className="accent-brand-600" /> Low only</label>
            <button className="btn-secondary">Go</button>
          </form>
          <div className="card overflow-x-auto">
            <table className="table-base min-w-[600px]"><thead><tr><th>Product</th><th className="text-center">Stock</th><th className="text-center">Alert at</th><th className="text-right">Cost value</th><th className="text-right">Sale value</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">Nothing here.</td></tr>}
                {list.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/admin/products/${p.id}`} className="font-semibold">{p.name}</Link><p className="text-xs text-gray-500">{p.category?.name || ""}</p></td>
                    <td className="text-center"><span className={`badge ${p.stock <= 0 ? "bg-red-100 text-red-700" : p.stock <= p.lowStockAt ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{p.stock} {p.unit}</span></td>
                    <td className="text-center text-gray-500">{p.lowStockAt}</td>
                    <td className="text-right">{inr(p.stock * p.dbLanding)}</td>
                    <td className="text-right">{inr(p.stock * p.sellPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="border-b px-4 py-3 font-bold">Recent stock movements</div>
            <table className="table-base"><thead><tr><th>When</th><th>Product</th><th>Reason</th><th className="text-right">Qty</th></tr></thead>
              <tbody>{movements.map((m) => <tr key={m.id}><td className="whitespace-nowrap text-xs text-gray-500">{fmtDateTime(m.createdAt)}</td><td>{m.product.name}</td><td className="text-gray-600">{m.reason}</td><td className={`text-right font-semibold ${m.qty > 0 ? "text-green-700" : "text-red-600"}`}>{m.qty > 0 ? "+" : ""}{m.qty}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <StockAdjustForm products={products.map((p) => ({ id: p.id, name: p.name, stock: p.stock }))} />
      </div>
    </div>
  );
}
