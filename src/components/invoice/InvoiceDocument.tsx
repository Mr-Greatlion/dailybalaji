import { amountInWords, inrPlain } from "@/lib/pricing";
import { fmtDate } from "@/lib/utils";

export type InvoiceData = {
  invoiceNo: string;
  type: "GST" | "NON_GST";
  date: Date;
  paymentStatus: string;
  paymentMethod: string;
  notes: string | null;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  total: number;
  customer: { name: string; company: string | null; gstin: string | null; phone: string; email: string | null; address: string; city: string; state: string; pincode: string };
  items: { name: string; hsn: string | null; unit: string; qty: number; unitPrice: number; gstRate: number; taxable: number; tax: number; amount: number }[];
  order?: { orderNo: string } | null;
};

export function InvoiceDocument({ inv, s, upiQr }: { inv: InvoiceData; s: Record<string, string>; upiQr?: string | null }) {
  const isGst = inv.type === "GST";
  const intra = inv.igst === 0;
  return (
    <div className="print-page mx-auto max-w-[800px] bg-white p-6 text-[13px] text-black shadow-card sm:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide">{s.company_name}</h1>
          <p className="mt-1 max-w-sm leading-snug">{s.company_address}</p>
          <p>Ph: {s.company_phone}{s.company_email ? ` • ${s.company_email}` : ""}</p>
          {isGst && <p className="font-semibold">GSTIN: {s.company_gstin}</p>}
          <p>FSSAI: {s.company_fssai}{s.company_pan ? ` • PAN: ${s.company_pan}` : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{isGst ? "TAX INVOICE" : "BILL OF SUPPLY"}</p>
          <p className="mt-1"><span className="text-gray-600">Invoice No:</span> <b>{inv.invoiceNo}</b></p>
          <p><span className="text-gray-600">Date:</span> {fmtDate(inv.date)}</p>
          {inv.order && <p><span className="text-gray-600">Order:</span> {inv.order.orderNo}</p>}
          <p className="mt-1"><span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${inv.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{inv.paymentStatus}</span></p>
        </div>
      </div>

      {/* Bill to */}
      <div className="mt-3 grid grid-cols-2 gap-4 border-b border-gray-300 pb-3">
        <div>
          <p className="text-[11px] font-bold uppercase text-gray-500">Bill to</p>
          <p className="font-bold">{inv.customer.company || inv.customer.name}</p>
          {inv.customer.company && <p>{inv.customer.name}</p>}
          <p>{inv.customer.address}</p>
          <p>{inv.customer.city}{inv.customer.pincode ? ` - ${inv.customer.pincode}` : ""}, {inv.customer.state}</p>
          <p>Ph: {inv.customer.phone}</p>
          {isGst && inv.customer.gstin && <p className="font-semibold">GSTIN: {inv.customer.gstin}</p>}
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase text-gray-500">Place of supply</p>
          <p>{inv.customer.state}</p>
          <p className="mt-2 text-[11px] font-bold uppercase text-gray-500">Payment</p>
          <p>{inv.paymentMethod === "RAZORPAY" ? "Online" : inv.paymentMethod === "COD" ? "Cash / UPI" : "Bank transfer"}</p>
        </div>
      </div>

      {/* Items */}
      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-[11px] uppercase">
            <th className="border border-gray-300 px-2 py-1.5 text-left">#</th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">Item</th>
            {isGst && <th className="border border-gray-300 px-2 py-1.5">HSN</th>}
            <th className="border border-gray-300 px-2 py-1.5">Qty</th>
            <th className="border border-gray-300 px-2 py-1.5 text-right">Rate</th>
            {isGst && <th className="border border-gray-300 px-2 py-1.5 text-right">Taxable</th>}
            {isGst && <th className="border border-gray-300 px-2 py-1.5">GST%</th>}
            {isGst && <th className="border border-gray-300 px-2 py-1.5 text-right">Tax</th>}
            <th className="border border-gray-300 px-2 py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it, i) => (
            <tr key={i}>
              <td className="border border-gray-300 px-2 py-1.5">{i + 1}</td>
              <td className="border border-gray-300 px-2 py-1.5">{it.name}</td>
              {isGst && <td className="border border-gray-300 px-2 py-1.5 text-center">{it.hsn || "-"}</td>}
              <td className="border border-gray-300 px-2 py-1.5 text-center">{it.qty} {it.unit}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right">{inrPlain(it.unitPrice)}</td>
              {isGst && <td className="border border-gray-300 px-2 py-1.5 text-right">{inrPlain(it.taxable)}</td>}
              {isGst && <td className="border border-gray-300 px-2 py-1.5 text-center">{it.gstRate}%</td>}
              {isGst && <td className="border border-gray-300 px-2 py-1.5 text-right">{inrPlain(it.tax)}</td>}
              <td className="border border-gray-300 px-2 py-1.5 text-right font-medium">{inrPlain(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-3 flex justify-between gap-4">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase text-gray-500">Amount in words</p>
          <p className="font-semibold">{amountInWords(inv.total)}</p>
          {inv.notes && <p className="mt-3 text-xs text-gray-600">Note: {inv.notes}</p>}
        </div>
        <table className="w-64 shrink-0">
          <tbody>
            <tr><td className="py-0.5 text-gray-600">{isGst ? "Taxable value" : "Sub total"}</td><td className="py-0.5 text-right">{inrPlain(inv.subtotal)}</td></tr>
            {isGst && intra && <><tr><td className="py-0.5 text-gray-600">CGST</td><td className="py-0.5 text-right">{inrPlain(inv.cgst)}</td></tr><tr><td className="py-0.5 text-gray-600">SGST</td><td className="py-0.5 text-right">{inrPlain(inv.sgst)}</td></tr></>}
            {isGst && !intra && <tr><td className="py-0.5 text-gray-600">IGST</td><td className="py-0.5 text-right">{inrPlain(inv.igst)}</td></tr>}
            {inv.roundOff !== 0 && <tr><td className="py-0.5 text-gray-600">Round off</td><td className="py-0.5 text-right">{inv.roundOff > 0 ? "+" : ""}{inrPlain(inv.roundOff)}</td></tr>}
            <tr className="border-t-2 border-black text-base font-black"><td className="py-1">TOTAL</td><td className="py-1 text-right">₹ {inrPlain(inv.total)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Payment: UPI QR + bank details on every bill */}
      <div className="mt-4 flex items-stretch gap-4 rounded-lg border border-gray-300 p-3">
        {upiQr ? (
          <div className="flex shrink-0 flex-col items-center">
            <div className="h-[118px] w-[118px]" dangerouslySetInnerHTML={{ __html: upiQr }} />
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide">{inv.paymentStatus === "PAID" ? "Scan & Pay (UPI)" : `Scan & Pay ₹${inrPlain(inv.total)}`}</p>
          </div>
        ) : null}
        <div className="flex-1 text-[12px] leading-snug">
          <p className="text-[11px] font-bold uppercase text-gray-500">Payment details</p>
          {s.bank_upi && <p>UPI ID: <b>{s.bank_upi}</b> <span className="text-gray-500">(GPay / PhonePe / Paytm / BHIM)</span></p>}
          <p className="mt-1 font-semibold">{s.bank_holder}</p>
          <p>{s.bank_name}, {s.bank_branch}</p>
          {s.bank_account && <p>A/c No: <b>{s.bank_account}</b></p>}
          <p>IFSC: <b>{s.bank_ifsc}</b></p>
          <p className="mt-1 text-[11px] text-gray-500">Please mention invoice no. {inv.invoiceNo} in the payment remark.</p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-gray-300 pt-3 text-xs">
        <p className="max-w-md text-gray-600">{s.invoice_terms}</p>
        <div className="text-center">
          <p className="mb-8 font-semibold">For {s.company_name}</p>
          <p className="border-t border-gray-400 pt-1">Authorised Signatory</p>
        </div>
      </div>
    </div>
  );
}
