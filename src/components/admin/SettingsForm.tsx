"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { saveSettings, changeAdminPassword } from "@/app/admin/actions";
import { toast } from "@/components/ui/Toaster";
import { INDIAN_STATES } from "@/lib/utils";

const F = ({ k, label, s, type = "text", span, hint }: { k: string; label: string; s: Record<string, string>; type?: string; span?: boolean; hint?: string }) => (
  <div className={span ? "sm:col-span-2" : ""}>
    <label className="label">{label}</label>
    {type === "textarea" ? <textarea name={k} rows={2} defaultValue={s[k]} className="input" /> : <input name={k} type={type} step={type === "number" ? "any" : undefined} defaultValue={s[k]} className="input" />}
    {hint && <p className="mt-1 text-[11px] text-gray-500">{hint}</p>}
  </div>
);

export function SettingsForm({ s }: { s: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="mt-4 space-y-5">
      <form action={(fd) => start(async () => { const r = await saveSettings(fd); if (r.ok) { toast("Settings saved"); router.refresh(); } else toast(r.error, "error"); })} className="space-y-5">
        <section className="card p-5">
          <h2 className="font-bold">Pricing & delivery</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <F k="margin_percent" label="Profit margin % on dealer price" s={s} type="number" hint="Changing this recalculates all auto-priced products. Sell = dealer + margin + GST on margin." />
            <F k="delivery_charge" label="Delivery charge (₹)" s={s} type="number" />
            <F k="free_delivery_above" label="Free delivery above (₹, 0 = never)" s={s} type="number" />
            <F k="min_order" label="Minimum order value (₹, 0 = none)" s={s} type="number" />
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-bold">Company (printed on invoices)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <F k="company_name" label="Company name" s={s} />
            <F k="company_tagline" label="Tagline" s={s} />
            <F k="company_address" label="Address" s={s} type="textarea" span />
            <div><label className="label">State</label><select name="company_state" defaultValue={s.company_state} className="input">{INDIAN_STATES.map((st) => <option key={st}>{st}</option>)}</select></div>
            <F k="company_state_code" label="State code" s={s} />
            <F k="company_gstin" label="GSTIN" s={s} />
            <F k="company_pan" label="PAN" s={s} />
            <F k="company_fssai" label="FSSAI licence no" s={s} />
            <F k="company_phone" label="Phone" s={s} />
            <F k="company_whatsapp" label="WhatsApp number" s={s} />
            <F k="company_email" label="Email" s={s} />
            <F k="invoice_prefix" label="Invoice prefix" s={s} hint="Invoices are numbered PREFIX/2026-27/0001" />
            <F k="invoice_terms" label="Invoice footer terms" s={s} type="textarea" span />
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-bold">Bank details (on GST invoices & bank-transfer orders)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <F k="bank_holder" label="Account holder" s={s} />
            <F k="bank_name" label="Bank" s={s} />
            <F k="bank_branch" label="Branch" s={s} />
            <F k="bank_account" label="Account number" s={s} />
            <F k="bank_ifsc" label="IFSC" s={s} />
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-bold">Store front text</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <F k="announcement" label="Top announcement bar" s={s} span />
            <F k="hero_title" label="Home hero title" s={s} span />
            <F k="hero_subtitle" label="Home hero subtitle" s={s} type="textarea" span />
          </div>
        </section>
        <button disabled={pending} className="btn-primary h-11 px-8">{pending ? "Saving…" : "Save settings"}</button>
      </form>

      <form action={(fd) => start(async () => { const r = await changeAdminPassword(fd); toast(r.ok ? "Password changed" : r.error, r.ok ? "success" : "error"); })} className="card p-5">
        <h2 className="font-bold">Change admin password</h2>
        <div className="mt-3 flex max-w-md gap-2"><input name="password" type="password" minLength={6} required placeholder="New password" className="input" /><button disabled={pending} className="btn-secondary shrink-0">Update</button></div>
      </form>
    </div>
  );
}
