"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Printer, CheckCircle2, Undo2, Trash2 } from "lucide-react";
import { setInvoicePayment, deleteInvoice } from "@/app/admin/actions";
import { toast } from "@/components/ui/Toaster";

export function InvoiceRowActions({ id, paymentStatus }: { id: string; paymentStatus: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/invoice/${id}`} className="btn-ghost px-2" title="Print / PDF"><Printer className="h-4 w-4" /></Link>
      {paymentStatus === "PAID" ? (
        <button disabled={pending} title="Mark unpaid" className="btn-ghost px-2" onClick={() => start(async () => { await setInvoicePayment(id, "PENDING"); router.refresh(); })}><Undo2 className="h-4 w-4" /></button>
      ) : (
        <button disabled={pending} title="Mark paid" className="btn-ghost px-2 text-green-700" onClick={() => start(async () => { await setInvoicePayment(id, "PAID"); toast("Marked paid"); router.refresh(); })}><CheckCircle2 className="h-4 w-4" /></button>
      )}
      <button disabled={pending} title="Delete" className="btn-ghost px-2 text-red-600" onClick={() => { if (!confirm("Delete this invoice? Stock deducted by it will be restored.")) return; start(async () => { const r = await deleteInvoice(id); toast(r.ok ? "Deleted" : r.error, r.ok ? "success" : "error"); router.refresh(); }); }}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
