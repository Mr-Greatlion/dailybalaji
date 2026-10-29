"use client";

import Link from "next/link";
import { saveCustomer, deleteCustomer } from "@/app/admin/actions";
import { EntityForm, RowEditDelete, useEditor } from "./EntityForm";
import { INDIAN_STATES } from "@/lib/utils";
import { inr } from "@/lib/pricing";

type C = { id: string; name: string; company: string | null; type: "RETAIL" | "BUSINESS"; gstin: string | null; phone: string; email: string | null; address: string; city: string; state: string; pincode: string; notes: string | null; invoiceCount: number; orderCount: number; billed: number; unpaid: number };

export const customerFields = [
  { name: "name", label: "Customer name", required: true },
  { name: "phone", label: "Phone", required: true },
  { name: "type", label: "Type", type: "select" as const, options: [{ value: "RETAIL", label: "Retail" }, { value: "BUSINESS", label: "Business (GST)" }] },
  { name: "email", label: "Email", type: "email" as const },
  { name: "company", label: "Company / shop (business)" },
  { name: "gstin", label: "GSTIN (business)", upper: true },
  { name: "address", label: "Address", type: "textarea" as const, span: 2 as const },
  { name: "city", label: "City" },
  { name: "pincode", label: "Pincode" },
  { name: "state", label: "State", type: "select" as const, options: INDIAN_STATES, span: 2 as const },
  { name: "notes", label: "Notes", type: "textarea" as const, span: 2 as const },
];

export function CustomersClient({ customers }: { customers: C[] }) {
  const { editing, setEditing, close } = useEditor<C>();
  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-3">
      <div className="card overflow-x-auto lg:col-span-2">
        <div className="flex items-center justify-between border-b px-4 py-3"><span className="font-bold">{customers.length} customers</span><button className="btn-primary py-1.5" onClick={() => setEditing("new")}>+ Add customer</button></div>
        <table className="table-base min-w-[720px]"><thead><tr><th>Customer</th><th>Type</th><th>Contact</th><th className="text-center">Orders / Bills</th><th className="text-right">Billed</th><th className="text-right">Unpaid</th><th></th></tr></thead>
          <tbody>
            {customers.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">No customers yet.</td></tr>}
            {customers.map((c) => (
              <tr key={c.id}>
                <td><p className="font-semibold">{c.company || c.name}</p><p className="text-xs text-gray-500">{c.company ? `${c.name} • ` : ""}{c.city}{c.gstin ? ` • ${c.gstin}` : ""}</p></td>
                <td><span className={`badge ${c.type === "BUSINESS" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>{c.type}</span></td>
                <td className="text-sm"><p>{c.phone}</p><p className="text-xs text-gray-500">{c.email || ""}</p></td>
                <td className="text-center">{c.orderCount} / {c.invoiceCount}</td>
                <td className="text-right">{inr(c.billed)}</td>
                <td className={`text-right ${c.unpaid > 0 ? "font-semibold text-red-600" : ""}`}>{inr(c.unpaid)}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/billing/new?customer=${c.id}`} className="btn-ghost px-2 text-xs text-brand-700">Bill</Link>
                    <RowEditDelete onEdit={() => setEditing(c)} onDelete={() => deleteCustomer(c.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <EntityForm title={editing === "new" ? "New customer" : "Edit customer"} fields={customerFields} initial={editing === "new" ? { state: "Tamil Nadu", city: "Chennai", type: "RETAIL" } : editing} action={saveCustomer} onDone={close} />}
    </div>
  );
}
