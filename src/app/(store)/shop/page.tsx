import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/ProductCard";

export const metadata = { title: "Shop" };

type SP = { q?: string; category?: string; sort?: string; page?: string };

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const sort = sp.sort || "new";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const take = 24;

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (sp.category) where.category = { slug: sp.category };
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }];

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc" ? { sellPrice: "asc" } : sort === "price_desc" ? { sellPrice: "desc" } : sort === "name" ? { name: "asc" } : { createdAt: "desc" };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * take, take, include: { category: { select: { name: true } } } }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const pages = Math.max(1, Math.ceil(total / take));
  const active = categories.find((c) => c.slug === sp.category);

  const link = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...over };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, String(v)));
    return `/shop?${p.toString()}`;
  };

  return (
    <div className="container-x py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{active ? active.name : q ? `Results for "${q}"` : "All products"}</h1>
          <p className="text-sm text-gray-500">{total} product{total === 1 ? "" : "s"}</p>
        </div>
        <form className="flex items-center gap-2 text-sm">
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          <label className="text-gray-500">Sort</label>
          <select name="sort" defaultValue={sort} className="input w-auto py-1.5">
            <option value="new">Newest</option>
            <option value="name">Name A–Z</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          <button className="btn-secondary py-1.5">Apply</button>
        </form>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link href={link({ category: undefined, page: undefined })} className={`badge whitespace-nowrap px-3 py-1.5 ${!sp.category ? "bg-brand-600 text-white" : "bg-white ring-1 ring-gray-200"}`}>All</Link>
        {categories.map((c) => (
          <Link key={c.id} href={link({ category: c.slug, page: undefined })} className={`badge whitespace-nowrap px-3 py-1.5 ${sp.category === c.slug ? "bg-brand-600 text-white" : "bg-white ring-1 ring-gray-200"}`}>
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="card mt-6 p-12 text-center text-gray-500">No products found.</div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && <Link href={link({ page: String(page - 1) })} className="btn-secondary">Previous</Link>}
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          {page < pages && <Link href={link({ page: String(page + 1) })} className="btn-secondary">Next</Link>}
        </div>
      )}
    </div>
  );
}
