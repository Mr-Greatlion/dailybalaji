"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "@/components/ui/Toaster";
import { INDIAN_STATES } from "@/lib/utils";

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}

export function LoginForm({ next }: { next: string }) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ email: "", password: "" });
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const d = await post("/api/auth/login", f);
          window.location.href = d.role === "ADMIN" && next === "/account" ? "/admin" : next;
        } catch (err: any) {
          toast(err.message, "error");
          setBusy(false);
        }
      }}
    >
      <div><label className="label">Email</label><input required type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><label className="label">Password</label><input required type="password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
      <button disabled={busy} className="btn-primary h-11 w-full">{busy ? "Logging in…" : "Login"}</button>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-brand-700">Forgot password?</Link>
        <Link href="/register" className="text-brand-700">Create account</Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "", isBusiness: false, company: "", gstin: "", address: "", city: "Chennai", state: "Tamil Nadu", pincode: "" });
  const set = (k: string, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await post("/api/auth/register", f);
          window.location.href = "/account";
        } catch (err: any) {
          toast(err.message, "error");
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Full name *</label><input required className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><label className="label">Mobile *</label><input required pattern="[0-9]{10}" className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div><label className="label">Email *</label><input required type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div><label className="label">Password *</label><input required minLength={6} type="password" className="input" value={f.password} onChange={(e) => set("password", e.target.value)} /></div>
      </div>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-brand-50 p-3">
        <input type="checkbox" checked={f.isBusiness} onChange={(e) => set("isBusiness", e.target.checked)} className="h-4 w-4 accent-brand-600" />
        <span className="text-sm font-semibold">Business account (GST invoice needed)</span>
      </label>
      {f.isBusiness && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Company / shop name</label><input className="input" value={f.company} onChange={(e) => set("company", e.target.value)} /></div>
          <div><label className="label">GSTIN</label><input className="input uppercase" maxLength={15} value={f.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} /></div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Address</label><textarea rows={2} className="input" value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
        <div><label className="label">City</label><input className="input" value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div><label className="label">Pincode</label><input pattern="[0-9]{6}" className="input" value={f.pincode} onChange={(e) => set("pincode", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label">State</label><select className="input" value={f.state} onChange={(e) => set("state", e.target.value)}>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
      <button disabled={busy} className="btn-primary h-11 w-full">{busy ? "Creating…" : "Create account"}</button>
      <p className="text-center text-sm">Already have an account? <Link href="/login" className="text-brand-700">Login</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ email: "", otp: "", password: "" });
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          if (step === 1) {
            await post("/api/auth/forgot", { email: f.email });
            toast("If that email exists, an OTP has been sent.", "info");
            setStep(2);
          } else {
            await post("/api/auth/forgot", f);
            toast("Password updated. Please login.");
            window.location.href = "/login";
          }
        } catch (err: any) {
          toast(err.message, "error");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div><label className="label">Email</label><input required type="email" className="input" value={f.email} disabled={step === 2} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      {step === 2 && (
        <>
          <div><label className="label">6-digit OTP</label><input required maxLength={6} className="input tracking-widest" value={f.otp} onChange={(e) => setF({ ...f, otp: e.target.value })} /></div>
          <div><label className="label">New password</label><input required minLength={6} type="password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        </>
      )}
      <button disabled={busy} className="btn-primary h-11 w-full">{busy ? "Please wait…" : step === 1 ? "Send OTP" : "Reset password"}</button>
      <p className="text-center text-sm"><Link href="/login" className="text-brand-700">Back to login</Link></p>
    </form>
  );
}
