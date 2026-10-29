import Link from "next/link";
import { ArrowRight, BadgeCheck, Truck, ReceiptText, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/store/ProductCard";

export default async function HomePage() {
  const [s, categories, featured, latest] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: { where: { isActive: true } } } } } }),
    prisma.product.findMany({ where: { isActive: true, isFeatured: true }, include: { category: { select: { name: true } } }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.product.findMany({ where: { isActive: true }, include: { category: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const showFeatured = featured.length ? featured : latest.slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="container-x grid gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <span className="badge bg-white/15 text-white ring-1 ring-white/30">Trusted dairy supplier • Chennai</span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">{s.hero_title}</h1>
            <p className="mt-4 max-w-xl text-brand-50/90 sm:text-lg">{s.hero_subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-saffron h-12 px-6 text-base">Shop now <ArrowRight className="h-5 w-5" /></Link>
              <Link href="/register" className="btn h-12 bg-white/10 px-6 text-base text-white ring-1 ring-white/40 hover:bg-white/20">Business account</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { icon: Truck, t: "Fast delivery", d: "Same/next-day across Chennai" },
              { icon: ReceiptText, t: "GST invoices", d: "Proper tax invoice for businesses" },
              { icon: BadgeCheck, t: "Genuine brands", d: "Sourced from authorised dealers" },
              { icon: ShieldCheck, t: "FSSAI licensed", d: `Lic. ${s.company_fssai}` },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur">
                <f.icon className="h-7 w-7 text-saffron" />
                <p className="mt-2 font-bold">{f.t}</p>
                <p className="text-xs text-brand-50/80">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-x py-8">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-bold sm:text-2xl">Shop by category</h2>
            <Link href="/shop" className="text-sm font-semibold text-brand-700">View all</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
            {categories.map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="card min-w-[140px] flex-1 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card">
                <div className="aspect-[4/3] bg-brand-50">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-3xl">🥛</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-gray-500">{c._count.products} items</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="container-x py-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">{featured.length ? "Featured products" : "Our products"}</h2>
          <Link href="/shop" className="text-sm font-semibold text-brand-700">See all</Link>
        </div>
        {showFeatured.length === 0 ? (
          <div className="card p-10 text-center text-gray-500">Products are being added. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {showFeatured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* B2B CTA */}
      <section className="container-x py-10">
        <div className="card flex flex-col items-start gap-4 bg-gradient-to-r from-amber-50 to-brand-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h3 className="text-lg font-bold sm:text-xl">Hotels, restaurants, bakeries & shops</h3>
            <p className="mt-1 text-sm text-gray-600">Register as a business customer with your GSTIN and get proper GST tax invoices on every order, bulk pricing and account-based ordering.</p>
          </div>
          <Link href="/register" className="btn-primary h-11 shrink-0 px-6">Create business account</Link>
        </div>
      </section>
    </div>
  );
}
