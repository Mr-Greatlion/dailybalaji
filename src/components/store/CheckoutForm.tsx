"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/components/cart/CartProvider";
import { inr } from "@/lib/pricing";
import { INDIAN_STATES } from "@/lib/utils";
import { toast } from "@/components/ui/Toaster";
import { computeDelivery } from "./CartView";

type Prefill = { name: string; phone: string; email: string; address: string; city: string; state: string; pincode: string; gstin: string; company: string; isBusiness: boolean };
type Bank = { name: string; branch: string; account: string; ifsc: string; holder: string; upi: string };

declare global {
  interface Window { Razorpay?: any }
}

export function CheckoutForm({ deliveryCharge, freeAbove, razorpayKey, bank, companyName, prefill }: {
  deliveryCharge: number; freeAbove: number; razorpayKey: string; bank: Bank; companyName: string; prefill: Prefill;
}) {
  const { items, subtotal, clear, hydrated } = useCart();
  const router = useRouter();
  const [form, setForm] = useState(prefill);
  const [method, setMethod] = useState<"RAZORPAY" | "COD" | "BANK_TRANSFER">(razorpayKey ? "RAZORPAY" : "COD");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && items.length === 0) router.replace("/cart");
  }, [hydrated, items.length, router]);

  const delivery = computeDelivery(subtotal, deliveryCharge, freeAbove);
  const total = Math.round((subtotal + delivery) * 100) / 100;
  const set = (k: keyof Prefill, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.id, qty: i.qty })), ship: form, paymentMethod: method, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order");

      if (method === "RAZORPAY") {
        if (!window.Razorpay) throw new Error("Payment gateway not loaded. Please retry.");
        const rzp = new window.Razorpay({
          key: razorpayKey,
          amount: data.razorpay.amount,
          currency: "INR",
          name: companyName,
          description: `Order ${data.orderNo}`,
          order_id: data.razorpay.id,
          prefill: { name: form.name, email: form.email, contact: form.phone },
          theme: { color: "#237d4e" },
          handler: async (resp: any) => {
            const v = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderId, ...resp }),
            });
            if (v.ok) {
              clear();
              router.push(`/order-success/${data.orderNo}`);
            } else {
              toast("Payment verification failed. Contact us with your order number.", "error");
              setBusy(false);
            }
          },
          modal: { ondismiss: () => { toast("Payment cancelled. Your order is saved as pending.", "info"); setBusy(false); } },
        });
        rzp.open();
        return;
      }
      clear();
      router.push(`/order-success/${data.orderNo}`);
    } catch (err: any) {
      toast(err.message || "Something went wrong", "error");
      setBusy(false);
    }
  }

  return (
    <>
      {razorpayKey && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />}
      <form onSubmit={placeOrder} className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card p-5">
            <h2 className="font-bold">Delivery details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="label">Full name *</label><input required className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div><label className="label">Mobile number *</label><input required pattern="[0-9]{10}" title="10-digit mobile number" className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="label">Address *</label><textarea required rows={2} className="input" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
              <div><label className="label">City *</label><input required className="input" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
              <div><label className="label">Pincode *</label><input required pattern="[0-9]{6}" className="input" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="label">State *</label>
                <select className="input" value={form.state} onChange={(e) => set("state", e.target.value)}>{INDIAN_STATES.map((st) => <option key={st}>{st}</option>)}</select>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={form.isBusiness} onChange={(e) => set("isBusiness", e.target.checked)} className="h-4 w-4 accent-brand-600" />
              <span className="font-bold">This is a business purchase (need GST tax invoice)</span>
            </label>
            {form.isBusiness && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><label className="label">Company / Shop name</label><input className="input" value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
                <div><label className="label">GSTIN</label><input className="input uppercase" maxLength={15} value={form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} /></div>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-bold">Payment method</h2>
            <div className="mt-3 space-y-2">
              {razorpayKey && (
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${method === "RAZORPAY" ? "border-brand-500 bg-brand-50" : "border-gray-200"}`}>
                  <input type="radio" name="pm" checked={method === "RAZORPAY"} onChange={() => setMethod("RAZORPAY")} className="accent-brand-600" />
                  <div><p className="text-sm font-semibold">Pay online (UPI / Cards / Net banking)</p><p className="text-xs text-gray-500">Secure payment via Razorpay</p></div>
                </label>
              )}
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${method === "COD" ? "border-brand-500 bg-brand-50" : "border-gray-200"}`}>
                <input type="radio" name="pm" checked={method === "COD"} onChange={() => setMethod("COD")} className="accent-brand-600" />
                <div><p className="text-sm font-semibold">Cash / UPI on delivery</p><p className="text-xs text-gray-500">Pay when your order arrives</p></div>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${method === "BANK_TRANSFER" ? "border-brand-500 bg-brand-50" : "border-gray-200"}`}>
                <input type="radio" name="pm" checked={method === "BANK_TRANSFER"} onChange={() => setMethod("BANK_TRANSFER")} className="accent-brand-600" />
                <div><p className="text-sm font-semibold">Bank transfer (NEFT / IMPS)</p><p className="text-xs text-gray-500">For business accounts — we dispatch after payment</p></div>
              </label>
              {method === "BANK_TRANSFER" && (
                <div className="flex gap-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                  {bank.upi && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/upi-qr?am=${total.toFixed(2)}`} alt="UPI QR" className="h-24 w-24 shrink-0 rounded bg-white" />
                  )}
                  <div>
                  {bank.upi && <p>UPI ID: <b>{bank.upi}</b></p>}
                  <p className="font-semibold">{bank.holder}</p>
                  <p>{bank.name}, {bank.branch}</p>
                  {bank.account && <p>A/c No: <b>{bank.account}</b></p>}
                  <p>IFSC: <b>{bank.ifsc}</b></p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4"><label className="label">Order notes (optional)</label><textarea rows={2} className="input" placeholder="Delivery instructions, preferred time…" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </section>
        </div>

        <div className="card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="font-bold">Order summary</h2>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2"><span className="text-gray-700">{i.name} × {i.qty}</span><span className="shrink-0 font-medium">{inr(i.qty * i.unitPrice)}</span></li>
            ))}
          </ul>
          <div className="mt-3 space-y-1.5 border-t pt-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{inr(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span>{delivery === 0 ? "FREE" : inr(delivery)}</span></div>
            <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{inr(total)}</span></div>
          </div>
          <button type="submit" disabled={busy || items.length === 0} className="btn-primary mt-4 h-12 w-full text-base">
            {busy ? "Processing…" : method === "RAZORPAY" ? `Pay ${inr(total)}` : "Place order"}
          </button>
          <p className="mt-2 text-center text-xs text-gray-500">By placing this order you agree to our terms & conditions.</p>
        </div>
      </form>
    </>
  );
}
