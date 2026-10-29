import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/pricing";
import { AddToCart } from "@/components/store/AddToCart";
import { ProductCard } from "@/components/store/ProductCard";
import { ImageGallery } from "@/components/store/ImageGallery";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.product.findUnique({ where: { slug }, include: { category: true } });
  if (!p || !p.isActive) notFound();

  const related = await prisma.product.findMany({
    where: { isActive: true, id: { not: p.id }, categoryId: p.categoryId ?? undefined },
    include: { category: { select: { name: true } } },
    take: 4,
  });

  return (
    <div className="container-x py-6">
      <nav className="mb-4 text-xs text-gray-500">
        <Link href="/">Home</Link> / <Link href="/shop">Shop</Link>
        {p.category && <> / <Link href={`/shop?category=${p.category.slug}`}>{p.category.name}</Link></>}
      </nav>
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <ImageGallery images={p.images} name={p.name} />
        <div>
          {p.category && <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{p.category.name}</p>}
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{p.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{p.packSize || `per ${p.unit}`}{p.sku ? ` • SKU ${p.sku}` : ""}</p>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-3xl font-extrabold">{inr(p.sellPrice)}</p>
            {p.mrp && p.mrp > p.sellPrice && <p className="mb-1 text-gray-400 line-through">{inr(p.mrp)}</p>}
          </div>
          <p className="text-xs text-gray-500">Inclusive of all taxes{p.gstRate > 0 ? ` (GST ${p.gstRate}%)` : ""}</p>
          <p className={`mt-2 text-sm font-semibold ${p.stock > 0 ? "text-brand-700" : "text-red-600"}`}>
            {p.stock > 0 ? (p.stock <= p.lowStockAt ? `Only ${p.stock} left` : "In stock") : "Out of stock"}
          </p>
          <div className="mt-5 max-w-sm">
            <AddToCart product={{ id: p.id, name: p.name, slug: p.slug, image: p.images[0] || null, unitPrice: p.sellPrice, gstRate: p.gstRate, unit: p.unit, packSize: p.packSize, stock: p.stock }} />
          </div>
          {p.description && (
            <div className="mt-6">
              <h2 className="font-bold">About this product</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">{p.description}</p>
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="rounded-xl bg-brand-50 p-3">🚚 Fast delivery across Chennai</div>
            <div className="rounded-xl bg-brand-50 p-3">🧾 GST invoice available for businesses</div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
