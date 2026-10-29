"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createPurchase, type PurchaseLine } from "@/app/admin/actions";
import { toast } from "@/components/ui/Toaster";
import { inr, computeSellPrice } from "@/lib/pricing";
import { GST_RATES } from "@/lib/utils";

type Prod = { id: string; name: string; dbLanding: number; gstRate: number; stock: number; unit: string };

export function PurchaseForm({ vendors, products, margin }: { vendors: { id: string; name: string }[]; products: Prod[]; margin: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [vendorId, setVendorId] = useState(vendors[0]?.id || "");
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [updateLanding, setUpdateLanding] = useState(true);
  const [lines, setLines] = useState<PurchaseLine[]>([{ productId: "", qty: 1, rate: 0, gstRate: 5 }]);

  const setLine = (i: number, patch: Partial<PurchaseLine>) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const pick = (i: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    setLine(i, { productId, rate: p?.dbLanding || 0, gstRate: p?.gstRate ?? 5 });
  };
  const total = lines.reduce((a, l) => a + l.qty * l.rate, 0);

  return (
    <div className="mt-4 space-y-4">
      <section className="card grid gap-3 p-5 sm:grid-cols-4">
        <div className="sm:col-span-2"><label className="label">Vendor *</label>
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="input"><option value="">Select vendor…</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          {vendors.length === 0 && <p className="mt-1 text-xs text-red-600">No vendors yet — <Link href="/admin/vendors" className="underline">add one</Link>.</p>}
        </div>
        <div><label className="label">Dealer bill no</label><input value={billNo} onChange={(e) => setBillNo(e.target.value)} className="input" /></div>
        <div><label className="label">Bill date</label><input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="input" /></div>
        <div className="sm:col-span-4"><label className="label">Notes</label><input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="optional" /></div>
      </section>

      <section className="card overflow-x-auto">
        <table className="table-base min-w-[760px]">
          <thead><tr><th className="w-[36%]">Product</th><th className="text-center">Qty</th><th className="text-right">Rate / unit (incl GST)</th><th className="text-center">GST %</th><th className="text-right">Amount</th><th className="text-right">New sell price</th><th></th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td><select value={l.productId} onChange={(e) => pick(i, e.target.value)} className="input py-1.5"><option value="">Select product…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.stock})</option>)}</select></td>
                <td><input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: parseInt(e.target.value) || 0 })} className="input w-20 py-1.5 text-center" /></td>
                <td><input type="number" step="0.01" value={l.rate} onChange={(e) => setLine(i, { rate: parseFloat(e.target.value) || 0 })} className="input w-28 py-1.5 text-right" /></td>
                <td><select value={l.gstRate} onChange={(e) => setLine(i, { gstRate: parseFloat(e.target.value) })} className="input w-20 py-1.5">{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select></td>
                <td className="text-right font-medium">{inr(l.qty * l.rate)}</td>
                <td className="text-right text-brand-700">{l.rate ? inr(computeSellPrice(l.rate, l.gstRate, margin)) : "-"}</td>
                <td><button className="btn-ghost px-2 text-red-600" onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={7} className="p-3"><button className="btn-secondary py-1.5" onClick={() => setLines((ls) => [...ls, { productId: "", qty: 1, rate: 0, gstRate: 5 }])}><Plus className="h-4 w-4" /> Add line</button></td></tr></tfoot>
        </table>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={updateLanding} onChange={(e) => setUpdateLanding(e.target.checked)} className="accent-brand-600" /> Update each product's dealer price & recalculate sell price</label>
        <div className="flex items-center gap-4">
          <p className="text-lg font-extrabold">Total {inr(total)}</p>
          <button disabled={pending || !vendorId} className="btn-primary h-11 px-6" onClick={() => start(async () => {
            const r = await createPurchase({ vendorId, billNo, billDate, notes, lines, updateLanding });
            if (r.ok) { toast("Purchase saved, stock updated"); router.push("/admin/purchases"); router.refresh(); } else toast(r.error, "error");
          })}>{pending ? "Saving…" : "Save purchase"}</button>
        </div>
      </section>
      <p className="text-xs text-gray-500">Product not in the list yet? <Link href="/admin/products/new" className="text-brand-700 underline">Add it first</Link>, then come back here.</p>
    </div>
  );
}
