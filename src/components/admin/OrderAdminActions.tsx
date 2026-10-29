"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateOrder, invoiceFromOrder } from "@/app/admin/actions";
import { toast } from "@/components/ui/Toaster";

const STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];

export function OrderAdminActions({ id, status, paymentStatus, hasInvoice, isBusiness }: { id: string; status: string; paymentStatus: string; hasInvoice: boolean; isBusiness: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<any>, msg: string) => start(async () => { const r = await fn(); if (r?.ok === false) toast(r.error, "error"); else toast(msg); router.refresh(); });
  return (
    <div className="card h-fit space-y-4 p-5 lg:sticky lg:top-20">
      <div>
        <label className="label">Order status</label>
        <select defaultValue={status} disabled={pending} onChange={(e) => run(() => updateOrder(id, { status: e.target.value }), "Status updated")} className="input">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <p className="mt-1 text-[11px] text-gray-500">Customer gets an email on each change. Cancelling restores stock.</p>
      </div>
      <div>
        <label className="label">Payment status</label>
        <select defaultValue={paymentStatus} disabled={pending} onChange={(e) => run(() => updateOrder(id, { paymentStatus: e.target.value }), "Payment updated")} className="input"><option>PENDING</option><option>PAID</option><option>FAILED</option><option>REFUNDED</option></select>
      </div>
      {!hasInvoice && (
        <div>
          <label className="label">Generate invoice</label>
          <div className="grid gap-2">
            <button disabled={pending} className="btn-primary" onClick={() => start(async () => { const r = await invoiceFromOrder(id, "GST"); if (r.ok) router.push(`/invoice/${r.id}`); else toast(r.error, "error"); })}>GST tax invoice{isBusiness ? " (recommended)" : ""}</button>
            <button disabled={pending} className="btn-secondary" onClick={() => start(async () => { const r = await invoiceFromOrder(id, "NON_GST"); if (r.ok) router.push(`/invoice/${r.id}`); else toast(r.error, "error"); })}>Non-GST bill</button>
          </div>
        </div>
      )}
    </div>
  );
}
