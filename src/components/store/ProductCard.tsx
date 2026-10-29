import Link from "next/link";
import { inr } from "@/lib/pricing";
import { AddToCart } from "./AddToCart";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  images: string[];
  sellPrice: number;
  mrp: number | null;
  gstRate: number;
  unit: string;
  packSize: string | null;
  stock: number;
  category?: { name: string } | null;
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const img = p.images[0] || null;
  const off = p.mrp && p.mrp > p.sellPrice ? Math.round(((p.mrp - p.sellPrice) / p.mrp) * 100) : 0;
  return (
    <div className="card group flex flex-col overflow-hidden">
      <Link href={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden bg-gray-50">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl text-brand-200">🧀</div>
        )}
        {off > 0 && <span className="absolute left-2 top-2 badge bg-saffron text-white">{off}% OFF</span>}
        {p.stock <= 0 && <span className="absolute right-2 top-2 badge bg-gray-800 text-white">Out of stock</span>}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        {p.category && <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">{p.category.name}</p>}
        <Link href={`/product/${p.slug}`} className="mt-0.5 line-clamp-2 text-sm font-semibold text-ink hover:text-brand-700">
          {p.name}
        </Link>
        <p className="mt-0.5 text-xs text-gray-500">
          {p.packSize ? p.packSize : `per ${p.unit}`}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-base font-extrabold text-ink">{inr(p.sellPrice)}</p>
            {p.mrp && p.mrp > p.sellPrice && <p className="text-xs text-gray-400 line-through">{inr(p.mrp)}</p>}
          </div>
          <AddToCart
            compact
            product={{
              id: p.id,
              name: p.name,
              slug: p.slug,
              image: img,
              unitPrice: p.sellPrice,
              gstRate: p.gstRate,
              unit: p.unit,
              packSize: p.packSize,
              stock: p.stock,
            }}
          />
        </div>
      </div>
    </div>
  );
}
