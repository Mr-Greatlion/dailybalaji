"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart, type CartItem } from "@/components/cart/CartProvider";
import { toast } from "@/components/ui/Toaster";

export function AddToCart({ product, compact = false }: { product: Omit<CartItem, "qty">; compact?: boolean }) {
  const { items, add, update } = useCart();
  const inCart = items.find((i) => i.id === product.id);
  const out = product.stock <= 0;

  if (out) {
    return <button disabled className={compact ? "btn-secondary px-3 py-1.5 text-xs" : "btn-secondary w-full"}>Out of stock</button>;
  }

  if (inCart) {
    return (
      <div className={`flex items-center rounded-xl bg-brand-600 text-white ${compact ? "h-8" : "h-11 w-full justify-between px-1"}`}>
        <button className="grid h-full w-8 place-items-center" onClick={() => update(product.id, inCart.qty - 1)} aria-label="Decrease">
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-6 text-center text-sm font-bold">{inCart.qty}</span>
        <button
          className="grid h-full w-8 place-items-center disabled:opacity-40"
          disabled={inCart.qty >= product.stock}
          onClick={() => update(product.id, inCart.qty + 1)}
          aria-label="Increase"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      className={compact ? "btn-primary h-8 px-3 py-0 text-xs" : "btn-primary h-11 w-full"}
      onClick={() => {
        add(product, 1);
        toast(`${product.name} added to cart`);
      }}
    >
      <ShoppingCart className="h-4 w-4" /> Add
    </button>
  );
}
