"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { createInvoice, saveCustomer, type InvoiceLineInput } from "@/app/admin/actions";
import { toast } from "@/components/ui/Toaster";
import { inr, buildInvoiceTotals } from "@/lib/pricing";
import { GST_RATES } from "@/lib/utils";
import { EntityForm } from "./EntityForm";
import { customerFields } from "./CustomersClient";

type Cust = { id: string; name: string; company: string | null; phone: string; gstin: string | null; state: string; type: string };
type Prod = { id: string; name: string; hsn: string | null; unit: string; sellPrice: number; gstRate: number; stock: number; packSize: string | null };

export function BillingForm({ customers: initialCustomers, products, companyState, initialCustomerId }: { customers: Cust[]; products: Prod[]; companyState: string; initialCustomerId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [custQuery, setCustQuery] = useState("");
  const [newCust, setNewCust] = useState(false);
  const [type, setType] = useState<"GST" | "NON_GST">("GST");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID">("PENDING");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER" | "RAZORPAY">("BANK_TRANSFER");
  const [deductStock, setDeductStock] = useState(true);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLineInput[]>([{ productId: null, name: "", hsn: "", unit: "pc", qty: 1, unitPrice: 0, gstRate: 5 }]);
  const [prodQuery, setProdQuery] = useState("");

  const customer = customers.find((c) => c.id === customerId);
  const intra = customer ? customer.state.trim().toLowerCase() === companyState.trim().toLowerCase() : true;
  const totals = useMemo(() => buildInvoiceTotals(lines.filter((l) => l.name && l.qty > 0).map((l) => ({ unitPrice: l.unitPrice, qty: l.qty, gstRate: type === "GST" ? l.gstRate : 0 })), type, intra), [lines, type, intra]);

  const filteredCust = customers.filter((c) => !custQuery || `${c.name} ${c.company || ""} ${c.phone} ${c.gstin || ""}`.toLowerCase().includes(custQuery.toLowerCase())).slice(0, 50);
  const filteredProd = products.filter((p) => !prodQuery || p.name.toLowerCase().includes(prodQuery.toLowerCase())).slice(0, 12);

  const setLine = (i: number, patch: Partial<InvoiceLineInput>) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const addProduct = (p: Prod) => {
    setLines((ls) => {
      const blankIdx = ls.findIndex((l) => !l.name);
      const line: InvoiceLineInput = { productId: p.id, name: p.name + (p.packSize ? ` (${p.packSize})` : ""), hsn: p.hsn || "", unit: p.unit, qty: 1, unitPrice: p.sellPrice, gstRate: p.gstRate };
      const existing = ls.findIndex((l) => l.productId === p.id);
      if (existing >= 0) return ls.map((l, k) => (k === existing ? { ...l, qty: l.qty + 1 } : l));
      if (blankIdx >= 0) return ls.map((l, k) => (k === blankIdx ? line : l));
      return [...ls, line];
    });
    setProdQuery("");
  };

  async function submit() {
    start(async () => {
      const r = await createInvoice({ customerId, type, date, paymentStatus, paymentMethod, notes, lines, deductStock });
      if (r.ok) { toast("Invoice created"); router.push(`/invoice/${r.id}`); } else toast(r.error, "error");
    });
  }

  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {/* Customer */}
        <section className="card p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold">Customer</h2><button className="btn-secondary py-1.5" onClick={() => setNewCust((v) => !v)}><UserPlus className="h-4 w-4" /> New customer</button></div>
          {newCust ? (
            <div className="mt-3">
              <EntityForm
                title="Add customer"
                fields={customerFields}
                initial={{ state: "Tamil Nadu", city: "Chennai", type: "RETAIL" }}
                action={async (fd) => {
                  const r = await saveCustomer(fd);
                  if (r.ok && r.id) {
                    const c: Cust = { id: r.id, name: String(fd.get("name")), company: String(fd.get("company") || "") || null, phone: String(fd.get("phone")), gstin: String(fd.get("gstin") || "") || null, state: String(fd.get("state") || "Tamil Nadu"), type: String(fd.get("type")) };
                    setCustomers((cs) => [c, ...cs]);
                    setCustomerId(r.id);
                    setNewCust(false);
                  }
                  return r;
                }}
                onDone={() => setNewCust(false)}
                submitLabel="Save & select"
              />
            </div>
          ) : (
            <div className="mt-3">
              <input value={custQuery} onChange={(e) => setCustQuery(e.target.value)} placeholder="Search customer by name / company / phone / GSTIN" className="input" />
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} size={Math.min(6, Math.max(2, filteredCust.length))} className="input mt-2 h-auto">
                {filteredCust.map((c) => <option key={c.id} value={c.id}>{c.company ? `${c.company} — ${c.name}` : c.name} • {c.phone}{c.gstin ? ` • ${c.gstin}` : ""}</option>)}
              </select>
              {customer && <p className="mt-2 text-xs text-gray-600">Selected: <b>{customer.company || customer.name}</b> • {customer.state} → {type === "GST" ? (intra ? "CGST + SGST" : "IGST") : "no tax"}{customer.type === "BUSINESS" && !customer.gstin && type === "GST" ? " • ⚠ GSTIN missing" : ""}</p>}
            </div>
          )}
        </section>

        {/* Items */}
        <section className="card p-5">
          <h2 className="font-bold">Items</h2>
          <div className="relative mt-3">
            <input value={prodQuery} onChange={(e) => setProdQuery(e.target.value)} placeholder="Type to add product…" className="input" />
            {prodQuery && (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-white shadow-card">
                {filteredProd.length === 0 && <p className="p-3 text-sm text-gray-500">No match. Use a custom line below.</p>}
                {filteredProd.map((p) => (
                  <button key={p.id} onClick={() => addProduct(p)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-50">
                    <span>{p.name} <span className="text-xs text-gray-500">{p.packSize || p.unit} • stock {p.stock}</span></span><span className="font-semibold">{inr(p.sellPrice)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="table-base min-w-[700px]">
              <thead><tr><th className="w-[34%]">Item</th>{type === "GST" && <th>HSN</th>}<th className="text-center">Qty</th><th className="text-right">Rate (incl GST)</th>{type === "GST" && <th className="text-center">GST%</th>}<th className="text-right">Amount</th><th></th></tr></thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td><input value={l.name} onChange={(e) => setLine(i, { name: e.target.value, productId: l.productId && e.target.value !== l.name ? null : l.productId })} placeholder="Item name" className="input py-1.5" /></td>
                    {type === "GST" && <td><input value={l.hsn} onChange={(e) => setLine(i, { hsn: e.target.value })} className="input w-24 py-1.5" /></td>}
                    <td><input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: parseInt(e.target.value) || 0 })} className="input w-20 py-1.5 text-center" /></td>
                    <td><input type="number" step="0.01" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: parseFloat(e.target.value) || 0 })} className="input w-28 py-1.5 text-right" /></td>
                    {type === "GST" && <td><select value={l.gstRate} onChange={(e) => setLine(i, { gstRate: parseFloat(e.target.value) })} className="input w-20 py-1.5">{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select></td>}
                    <td className="text-right font-medium">{inr(l.qty * l.unitPrice)}</td>
                    <td><button className="btn-ghost px-2 text-red-600" onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn-secondary mt-3 py-1.5" onClick={() => setLines((ls) => [...ls, { productId: null, name: "", hsn: "", unit: "pc", qty: 1, unitPrice: 0, gstRate: 5 }])}><Plus className="h-4 w-4" /> Custom line</button>
        </section>
      </div>

      {/* Summary */}
      <section className="card h-fit space-y-3 p-5 lg:sticky lg:top-20">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          <button onClick={() => setType("GST")} className={`rounded-lg py-2 text-sm font-semibold ${type === "GST" ? "bg-white shadow-soft" : "text-gray-600"}`}>GST invoice</button>
          <button onClick={() => setType("NON_GST")} className={`rounded-lg py-2 text-sm font-semibold ${type === "NON_GST" ? "bg-white shadow-soft" : "text-gray-600"}`}>Non-GST bill</button>
        </div>
        <div><label className="label">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Payment</label><select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)} className="input"><option value="PENDING">Unpaid</option><option value="PAID">Paid</option></select></div>
          <div><label className="label">Mode</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="input"><option value="BANK_TRANSFER">Bank</option><option value="COD">Cash / UPI</option><option value="RAZORPAY">Online</option></select></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={deductStock} onChange={(e) => setDeductStock(e.target.checked)} className="accent-brand-600" /> Deduct stock</label>
        <div><label className="label">Notes on bill</label><input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" /></div>
        <div className="space-y-1 rounded-xl bg-brand-50 p-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">{type === "GST" ? "Taxable value" : "Subtotal"}</span><span>{inr(totals.subtotal)}</span></div>
          {type === "GST" && intra && <><div className="flex justify-between"><span className="text-gray-600">CGST</span><span>{inr(totals.cgst)}</span></div><div className="flex justify-between"><span className="text-gray-600">SGST</span><span>{inr(totals.sgst)}</span></div></>}
          {type === "GST" && !intra && <div className="flex justify-between"><span className="text-gray-600">IGST</span><span>{inr(totals.igst)}</span></div>}
          {totals.roundOff !== 0 && <div className="flex justify-between"><span className="text-gray-600">Round off</span><span>{totals.roundOff > 0 ? "+" : ""}{totals.roundOff.toFixed(2)}</span></div>}
          <div className="flex justify-between border-t border-brand-200 pt-1 text-lg font-extrabold"><span>Total</span><span>{inr(totals.total)}</span></div>
        </div>
        <button disabled={pending || !customerId || totals.total <= 0} onClick={submit} className="btn-primary h-12 w-full text-base">{pending ? "Creating…" : "Create & print"}</button>
      </section>
    </div>
  );
}
