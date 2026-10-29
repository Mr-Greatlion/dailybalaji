"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { adjustStock } from "@/app/admin/actions";
import { toast } from "@/components/ui/Toaster";

export function StockAdjustForm({ products }: { products: { id: string; name: string; stock: number }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      className="card h-fit p-5 lg:sticky lg:top-20"
      action={(fd) => start(async () => {
        const r = await adjustStock(fd);
        if (r.ok) { toast("Stock updated"); router.refresh(); } else toast(r.error, "error");
      })}
    >
      <h2 className="font-bold">Quick stock adjustment</h2>
      <p className="text-xs text-gray-500">Use + for stock in, − for damage / wastage / returns. For dealer purchases use the Purchase entry instead.</p>
      <div className="mt-3 space-y-3">
        <div><label className="label">Product</label><select name="productId" required className="input"><option value="">Select…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} (now {p.stock})</option>)}</select></div>
        <div><label className="label">Quantity (+ / −)</label><input name="qty" type="number" required className="input" placeholder="e.g. 10 or -2" /></div>
        <div><label className="label">Reason</label><select name="reason" className="input"><option>Stock count correction</option><option>Damaged / expired</option><option>Customer return</option><option>Free sample / own use</option><option>Opening stock</option><option>Other</option></select></div>
        <button disabled={pending} className="btn-primary w-full">{pending ? "Updating…" : "Apply"}</button>
      </div>
    </form>
  );
}
