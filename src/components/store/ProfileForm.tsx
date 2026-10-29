"use client";

import { useState } from "react";
import { toast } from "@/components/ui/Toaster";
import { INDIAN_STATES } from "@/lib/utils";

type C = { name: string; phone: string; email: string; company: string; gstin: string; type: "RETAIL" | "BUSINESS"; address: string; city: string; state: string; pincode: string };

export function ProfileForm({ customer }: { customer: C | null }) {
  const [f, setF] = useState<C>(customer || { name: "", phone: "", email: "", company: "", gstin: "", type: "RETAIL", address: "", city: "Chennai", state: "Tamil Nadu", pincode: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof C, v: string) => setF((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="card space-y-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await fetch("/api/account/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        setBusy(false);
        toast(r.ok ? "Profile saved" : "Could not save", r.ok ? "success" : "error");
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Name</label><input required className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><label className="label">Mobile</label><input required className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div><label className="label">Email</label><input type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div><label className="label">Account type</label><select className="input" value={f.type} onChange={(e) => set("type", e.target.value)}><option value="RETAIL">Retail</option><option value="BUSINESS">Business</option></select></div>
        {f.type === "BUSINESS" && (
          <>
            <div><label className="label">Company</label><input className="input" value={f.company} onChange={(e) => set("company", e.target.value)} /></div>
            <div><label className="label">GSTIN</label><input className="input uppercase" maxLength={15} value={f.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} /></div>
          </>
        )}
        <div className="sm:col-span-2"><label className="label">Address</label><textarea rows={2} className="input" value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
        <div><label className="label">City</label><input className="input" value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div><label className="label">Pincode</label><input className="input" value={f.pincode} onChange={(e) => set("pincode", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label">State</label><select className="input" value={f.state} onChange={(e) => set("state", e.target.value)}>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
      <button disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save profile"}</button>
    </form>
  );
}
