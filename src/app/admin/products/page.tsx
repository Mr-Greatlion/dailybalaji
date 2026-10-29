import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMargin } from "@/lib/settings";
import { inr } from "@/lib/pricing";
import { ProductRowActions, RecomputeButton } from "@/components/admin/ProductActions";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; inactive?: string }> }) {
  const sp = await searchParams;
  const where: Prisma.ProductWhereInput = {};
  if (sp.q) where.OR = [{ name: { contains: sp.q, mode: "insensitive" } }, { sku: { contains: sp.q, mode: "insensitive" } }];
  if (sp.category) where.categoryId = sp.category;
  if (!sp.inactive) where.isActive = true;
  const [products, categories, margin] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { name: "asc" }, include: { category: true, vendor: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getMargin(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="admin-section-title">Products</h1><p className="text-sm text-gray-500">{products.length} shown • global margin {margin}%</p></div>
        <div className="flex gap-2"><RecomputeButton /><Link href="/admin/products/new" className="btn-primary">+ Add product</Link></div>
      </div>

      <form className="card mt-4 flex flex-wrap items-end gap-2 p-3">
        <input name="q" defaultValue={sp.q} placeholder="Search name / SKU" className="input w-full sm:w-64" />
        <select name="category" defaultValue={sp.category || ""} className="input w-full sm:w-48"><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="inactive" value="1" defaultChecked={!!sp.inactive} className="accent-brand-600" /> Show inactive</label>
        <button className="btn-secondary">Filter</button>
      </form>

      <div className="card mt-4 overflow-x-auto">
        <table className="table-base min-w-[900px]">
          <thead><tr><th>Product</th><th>Category</th><th className="text-right">Dealer price</th><th className="text-center">GST</th><th className="text-right">Sell price</th><th className="text-right">Profit/unit</th><th className="text-center">Stock</th><th className="text-center">Status</th><th></th></tr></thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-gray-500">No products yet. Add your first product or create a purchase entry.</td></tr>}
            {products.map((p) => {
              const profit = p.sellPrice - p.dbLanding;
              return (
                <tr key={p.id} className={!p.isActive ? "opacity-60" : ""}>
                  <td>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">{p.images[0] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div>
                      <div><p className="font-semibold text-ink">{p.name}</p><p className="text-xs text-gray-500">{p.packSize || p.unit}{p.sku ? ` • ${p.sku}` : ""}{p.vendor ? ` • ${p.vendor.name}` : ""}</p></div>
                    </Link>
                  </td>
                  <td className="text-gray-600">{p.category?.name || "-"}</td>
                  <td className="text-right">{inr(p.dbLanding)}</td>
                  <td className="text-center">{p.gstRate}%</td>
                  <td className="text-right font-semibold">{inr(p.sellPrice)}{p.priceOverride ? <span className="ml-1 badge bg-purple-100 text-purple-700">manual</span> : null}</td>
                  <td className="text-right text-brand-700">{inr(profit)}</td>
                  <td className="text-center"><span className={`badge ${p.stock <= 0 ? "bg-red-100 text-red-700" : p.stock <= p.lowStockAt ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{p.stock}</span></td>
                  <td className="text-center"><span className={`badge ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>{p.isActive ? "Active" : "Hidden"}</span>{p.isFeatured && <span className="ml-1 badge bg-saffron/20 text-amber-800">★</span>}</td>
                  <td className="text-right"><ProductRowActions id={p.id} isActive={p.isActive} isFeatured={p.isFeatured} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
