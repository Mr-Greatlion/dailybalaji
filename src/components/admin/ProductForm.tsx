"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProduct } from "@/app/admin/actions";
import { toast } from "@/components/ui/Toaster";
import { priceBreakdown, inr } from "@/lib/pricing";
import { UNITS, GST_RATES } from "@/lib/utils";
import { ImageUploader } from "./ImageUploader";

type P = {
  id?: string; name: string; slug?: string; sku: string | null; hsn: string | null; description: string; categoryId: string | null; vendorId: string | null;
  unit: string; packSize: string | null; images: string[]; dbLanding: number; gstRate: number; marginPercent: number | null; priceOverride: number | null; mrp: number | null;
  stock?: number; lowStockAt: number; isActive: boolean; isFeatured: boolean;
};

export function ProductForm({ product, categories, vendors, globalMargin }: { product?: P; categories: { id: string; name: string }[]; vendors: { id: string; name: string }[]; globalMargin: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [dbLanding, setDbLanding] = useState(product?.dbLanding ?? 0);
  const [gstRate, setGstRate] = useState(product?.gstRate ?? 5);
  const [marginPercent, setMarginPercent] = useState<string>(product?.marginPercent != null ? String(product.marginPercent) : "");
  const [priceOverride, setPriceOverride] = useState<string>(product?.priceOverride != null ? String(product.priceOverride) : "");

  const bd = useMemo(() => priceBreakdown(dbLanding || 0, gstRate || 0, marginPercent === "" ? globalMargin : parseFloat(marginPercent) || 0), [dbLanding, gstRate, marginPercent, globalMargin]);
  const finalPrice = priceOverride !== "" && parseFloat(priceOverride) > 0 ? parseFloat(priceOverride) : bd.sellPrice;

  return (
    <form
      className="mt-4 grid gap-5 lg:grid-cols-3"
      action={(fd) => {
        fd.set("images", images.join("\n"));
        start(async () => {
          const r = await saveProduct(fd);
          if (r.ok) { toast("Product saved"); router.push("/admin/products"); router.refresh(); } else toast(r.error, "error");
        });
      }}
    >
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      <div className="space-y-5 lg:col-span-2">
        <section className="card p-5">
          <h2 className="font-bold">Basic details</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label">Product name *</label><input name="name" required defaultValue={product?.name} className="input" placeholder="e.g. Gowardhan Cheese Slices 200g" /></div>
            <div><label className="label">Category</label><select name="categoryId" defaultValue={product?.categoryId || ""} className="input"><option value="">— none —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Vendor / dealer</label><select name="vendorId" defaultValue={product?.vendorId || ""} className="input"><option value="">— none —</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
            <div><label className="label">SKU / code</label><input name="sku" defaultValue={product?.sku || ""} className="input" /></div>
            <div><label className="label">HSN code</label><input name="hsn" defaultValue={product?.hsn || ""} className="input" placeholder="e.g. 0406 for cheese" /></div>
            <div><label className="label">Unit</label><select name="unit" defaultValue={product?.unit || "pc"} className="input">{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
            <div><label className="label">Pack size (shown to customer)</label><input name="packSize" defaultValue={product?.packSize || ""} className="input" placeholder="e.g. 200 g pack / 1 kg tin" /></div>
            <div className="sm:col-span-2"><label className="label">Description</label><textarea name="description" rows={4} defaultValue={product?.description} className="input" /></div>
            <div><label className="label">URL slug (optional)</label><input name="slug" defaultValue={product?.slug || ""} className="input" placeholder="auto from name" /></div>
            <div><label className="label">MRP (optional, for strike-through)</label><input name="mrp" type="number" step="0.01" defaultValue={product?.mrp ?? ""} className="input" /></div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold">Photos</h2>
          <p className="text-xs text-gray-500">Upload from phone camera or gallery. First photo is the main image.</p>
          <ImageUploader images={images} onChange={setImages} />
        </section>

        <section className="card p-5">
          <h2 className="font-bold">Stock</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {!product?.id && <div><label className="label">Opening stock</label><input name="stock" type="number" defaultValue={0} className="input" /></div>}
            {product?.id && <div><label className="label">Current stock</label><input disabled value={product.stock} className="input bg-gray-50" /><p className="mt-1 text-[11px] text-gray-500">Change via Inventory or Purchases</p></div>}
            <div><label className="label">Low-stock alert at</label><input name="lowStockAt" type="number" defaultValue={product?.lowStockAt ?? 5} className="input" /></div>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="accent-brand-600" /> Visible in store</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured ?? false} className="accent-brand-600" /> Featured on home</label>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <section className="card p-5 lg:sticky lg:top-20">
          <h2 className="font-bold">Pricing engine</h2>
          <div className="mt-3 space-y-3">
            <div><label className="label">Dealer price per unit (incl. GST) *</label><input name="dbLanding" type="number" step="0.01" required value={dbLanding} onChange={(e) => setDbLanding(parseFloat(e.target.value) || 0)} className="input text-lg font-semibold" /></div>
            <div><label className="label">GST rate %</label><select name="gstRate" value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))} className="input">{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select></div>
            <div><label className="label">Margin % (blank = global {globalMargin}%)</label><input name="marginPercent" type="number" step="0.01" value={marginPercent} onChange={(e) => setMarginPercent(e.target.value)} className="input" placeholder={String(globalMargin)} /></div>
            <div><label className="label">Manual sell price (overrides formula)</label><input name="priceOverride" type="number" step="0.01" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} className="input" placeholder="leave blank to auto-calculate" /></div>
          </div>
          <div className="mt-4 rounded-xl bg-brand-50 p-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Dealer price</span><span>{inr(bd.dbLanding)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">+ Profit ({marginPercent === "" ? globalMargin : marginPercent}%)</span><span className="text-brand-700">{inr(bd.profit)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">+ GST on profit ({gstRate}%)</span><span>{inr(bd.gstOnProfit)}</span></div>
            <div className="mt-1 flex justify-between border-t border-brand-200 pt-1 text-base font-extrabold"><span>Sell price</span><span>{inr(finalPrice)}</span></div>
            <p className="mt-2 text-[11px] text-gray-500">On GST invoice: taxable {inr(finalPrice / (1 + gstRate / 100))} + GST {inr(finalPrice - finalPrice / (1 + gstRate / 100))}</p>
          </div>
          <button disabled={pending} className="btn-primary mt-4 h-11 w-full">{pending ? "Saving…" : "Save product"}</button>
        </section>
      </div>
    </form>
  );
}
