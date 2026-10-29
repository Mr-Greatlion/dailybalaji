"use client";

import { saveVendor, deleteVendor } from "@/app/admin/actions";
import { EntityForm, RowEditDelete, useEditor } from "./EntityForm";
import { INDIAN_STATES } from "@/lib/utils";
import { inr } from "@/lib/pricing";

type V = { id: string; name: string; contact: string | null; phone: string; email: string | null; gstin: string | null; address: string; city: string; state: string; pincode: string; notes: string | null; purchaseCount: number; productCount: number; totalBought: number };

export const vendorFields = [
  { name: "name", label: "Vendor / company name", required: true },
  { name: "contact", label: "Contact person" },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email", type: "email" as const },
  { name: "gstin", label: "GSTIN", upper: true },
  { name: "state", label: "State", type: "select" as const, options: INDIAN_STATES },
  { name: "address", label: "Address", type: "textarea" as const, span: 2 as const },
  { name: "city", label: "City" },
  { name: "pincode", label: "Pincode" },
  { name: "notes", label: "Notes", type: "textarea" as const, span: 2 as const },
];

export function VendorsClient({ vendors }: { vendors: V[] }) {
  const { editing, setEditing, close } = useEditor<V>();
  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-3">
      <div className="card overflow-x-auto lg:col-span-2">
        <div className="flex items-center justify-between border-b px-4 py-3"><span className="font-bold">{vendors.length} vendors</span><button className="btn-primary py-1.5" onClick={() => setEditing("new")}>+ Add vendor</button></div>
        <table className="table-base min-w-[640px]"><thead><tr><th>Vendor</th><th>Contact</th><th>GSTIN</th><th className="text-center">Purchases</th><th className="text-right">Total bought</th><th></th></tr></thead>
          <tbody>
            {vendors.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">No vendors yet. Add your dealer (e.g. Parag Milk Foods).</td></tr>}
            {vendors.map((v) => (
              <tr key={v.id}>
                <td><p className="font-semibold">{v.name}</p><p className="text-xs text-gray-500">{v.city}{v.state ? `, ${v.state}` : ""}</p></td>
                <td className="text-sm">{v.contact && <p>{v.contact}</p>}<p className="text-gray-500">{v.phone}</p></td>
                <td className="text-xs">{v.gstin || "-"}</td>
                <td className="text-center">{v.purchaseCount}</td>
                <td className="text-right">{inr(v.totalBought)}</td>
                <td><RowEditDelete onEdit={() => setEditing(v)} onDelete={() => deleteVendor(v.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <EntityForm title={editing === "new" ? "New vendor" : "Edit vendor"} fields={vendorFields} initial={editing === "new" ? { state: "Tamil Nadu" } : editing} action={saveVendor} onDone={close} />}
    </div>
  );
}
