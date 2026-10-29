"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, Trash2, Eye, EyeOff, Star, RefreshCw } from "lucide-react";
import { deleteProduct, toggleProduct, recomputeAllPrices } from "@/app/admin/actions";
import { toast } from "@/components/ui/Toaster";

export function ProductRowActions({ id, isActive, isFeatured }: { id: string; isActive: boolean; isFeatured: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-end gap-1">
      <button title={isFeatured ? "Unfeature" : "Feature on home"} disabled={pending} className="btn-ghost px-2" onClick={() => start(async () => { await toggleProduct(id, "isFeatured", !isFeatured); router.refresh(); })}><Star className={`h-4 w-4 ${isFeatured ? "fill-saffron text-saffron" : ""}`} /></button>
      <button title={isActive ? "Hide from store" : "Show in store"} disabled={pending} className="btn-ghost px-2" onClick={() => start(async () => { await toggleProduct(id, "isActive", !isActive); router.refresh(); })}>{isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
      <Link href={`/admin/products/${id}`} className="btn-ghost px-2"><Pencil className="h-4 w-4" /></Link>
      <button disabled={pending} className="btn-ghost px-2 text-red-600" onClick={() => { if (!confirm("Delete this product?")) return; start(async () => { const r = await deleteProduct(id); toast(r.ok ? "Deleted" : r.error, r.ok ? "success" : "info"); router.refresh(); }); }}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

export function RecomputeButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} className="btn-secondary" title="Recalculate all sell prices from dealer price + margin" onClick={() => start(async () => { await recomputeAllPrices(); toast("Prices recalculated"); router.refresh(); })}>
      <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} /> Recalculate prices
    </button>
  );
}
