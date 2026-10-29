"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { inr } from "@/lib/pricing";

export function computeDelivery(subtotal: number, deliveryCharge: number, freeAbove: number) {
  if (subtotal <= 0) return 0;
  if (freeAbove > 0 && subtotal >= freeAbove) return 0;
  return deliveryCharge;
}

export function CartView({ deliveryCharge, freeAbove, minOrder }: { deliveryCharge: number; freeAbove: number; minOrder: number }) {
  const { items, update, remove, subtotal, hydrated } = useCart();
  if (!hydrated) return <div className="mt-6 text-gray-500">Loading cart…</div>;
  if (!items.length)
    return (
      <div className="card mt-6 p-12 text-center">
        <p className="text-5xl">🛒</p>
        <p className="mt-3 font-semibold">Your cart is empty</p>
        <Link href="/shop" className="btn-primary mt-4">Start shopping</Link>
      </div>
    );

  const delivery = computeDelivery(subtotal, deliveryCharge, freeAbove);
  const total = Math.round((subtotal + delivery) * 100) / 100;
  const belowMin = minOrder > 0 && subtotal < minOrder;

  return (
    <div className="mt-5 grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {items.map((it) => (
          <div key={it.id} className="card flex gap-3 p-3">
            <Link href={`/product/${it.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50">
              {it.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-2xl">🧀</div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${it.slug}`} className="line-clamp-2 text-sm font-semibold">{it.name}</Link>
              <p className="text-xs text-gray-500">{it.packSize || `per ${it.unit}`} • {inr(it.unitPrice)}</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex h-8 items-center rounded-lg bg-gray-100">
                  <button className="grid h-full w-8 place-items-center" onClick={() => update(it.id, it.qty - 1)}><Minus className="h-4 w-4" /></button>
                  <span className="min-w-6 text-center text-sm font-bold">{it.qty}</span>
                  <button className="grid h-full w-8 place-items-center disabled:opacity-40" disabled={it.qty >= it.stock} onClick={() => update(it.id, it.qty + 1)}><Plus className="h-4 w-4" /></button>
                </div>
                <p className="font-bold">{inr(it.qty * it.unitPrice)}</p>
                <button className="btn-ghost px-2 text-red-600" onClick={() => remove(it.id)} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card h-fit p-5 lg:sticky lg:top-24">
        <h2 className="font-bold">Order summary</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{inr(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span>{delivery === 0 ? <span className="font-semibold text-brand-700">FREE</span> : inr(delivery)}</span></div>
          {freeAbove > 0 && delivery > 0 && <p className="text-xs text-brand-700">Add {inr(freeAbove - subtotal)} more for free delivery</p>}
          <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{inr(total)}</span></div>
          <p className="text-xs text-gray-500">Prices inclusive of GST</p>
        </div>
        {belowMin && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Minimum order value is {inr(minOrder)}.</p>}
        <Link href="/checkout" aria-disabled={belowMin} className={`btn-primary mt-4 h-12 w-full text-base ${belowMin ? "pointer-events-none opacity-50" : ""}`}>Proceed to checkout</Link>
        <Link href="/shop" className="btn-ghost mt-2 w-full">Continue shopping</Link>
      </div>
    </div>
  );
}
