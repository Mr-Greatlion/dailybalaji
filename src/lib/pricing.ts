/**
 * Balaji Agencies pricing engine.
 *
 * Rule (as decided by the owner):
 *   dealer price (DB landing, GST-inclusive)
 *   + profit  = dealer price × margin%           (default 5%)
 *   + GST on that profit = profit × gstRate%
 *   = SELL PRICE (GST-inclusive)
 *
 *   Example: ₹100 dealer, 5% margin, 5% GST → 100 + 5 + 0.25 = ₹105.25
 *
 * On a GST tax invoice the law requires tax to be shown on the full taxable
 * value, so the sell price is split back into taxable + GST:
 *   taxable = sellPrice / (1 + gstRate/100), tax = sellPrice - taxable.
 * The dealer's GST is input tax credit, so net GST payable = GST on the profit only.
 */

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeSellPrice(dbLanding: number, gstRate: number, marginPercent: number): number {
  const profit = dbLanding * (marginPercent / 100);
  const gstOnProfit = profit * (gstRate / 100);
  return round2(dbLanding + profit + gstOnProfit);
}

export function priceBreakdown(dbLanding: number, gstRate: number, marginPercent: number) {
  const profit = round2(dbLanding * (marginPercent / 100));
  const gstOnProfit = round2(profit * (gstRate / 100));
  const sellPrice = round2(dbLanding + profit + gstOnProfit);
  const taxable = round2(sellPrice / (1 + gstRate / 100));
  const tax = round2(sellPrice - taxable);
  return { dbLanding, profit, gstOnProfit, sellPrice, taxable, tax };
}

/** Split a GST-inclusive price into taxable value + tax. */
export function splitGst(priceIncl: number, gstRate: number) {
  const taxable = round2(priceIncl / (1 + gstRate / 100));
  const tax = round2(priceIncl - taxable);
  return { taxable, tax };
}

/** Resolve the effective sell price for a product given the global margin. */
export function effectiveSellPrice(
  p: { dbLanding: number; gstRate: number; marginPercent: number | null; priceOverride: number | null },
  globalMargin: number,
): number {
  if (p.priceOverride && p.priceOverride > 0) return round2(p.priceOverride);
  const margin = p.marginPercent ?? globalMargin;
  return computeSellPrice(p.dbLanding, p.gstRate, margin);
}

export type LineInput = { unitPrice: number; qty: number; gstRate: number };

/** Build invoice totals. intraState → CGST+SGST, else IGST. NON_GST → no tax split. */
export function buildInvoiceTotals(lines: LineInput[], type: "GST" | "NON_GST", intraState: boolean) {
  let subtotal = 0;
  let totalTax = 0;
  const items = lines.map((l) => {
    const amount = round2(l.unitPrice * l.qty);
    if (type === "NON_GST") {
      subtotal += amount;
      return { ...l, taxable: amount, tax: 0, amount };
    }
    const { taxable, tax } = splitGst(amount, l.gstRate);
    subtotal += taxable;
    totalTax += tax;
    return { ...l, taxable, tax, amount };
  });
  subtotal = round2(subtotal);
  totalTax = round2(totalTax);
  const cgst = type === "GST" && intraState ? round2(totalTax / 2) : 0;
  const sgst = type === "GST" && intraState ? round2(totalTax - cgst) : 0;
  const igst = type === "GST" && !intraState ? totalTax : 0;
  const raw = round2(subtotal + cgst + sgst + igst);
  const total = Math.round(raw);
  const roundOff = round2(total - raw);
  return { items, subtotal, cgst, sgst, igst, roundOff, total };
}

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

export const inrPlain = (n: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

/** Indian financial year string e.g. "2026-27" */
export function financialYear(d = new Date()) {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(2)}`;
}

/** Amount in words (Indian numbering) */
export function amountInWords(num: number): string {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number) => (n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : ""));
  const three = (n: number) => (n > 99 ? a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + two(n % 100) : "") : two(n));
  const whole = Math.floor(num);
  const paise = Math.round((num - whole) * 100);
  if (whole === 0) return "Zero Rupees Only";
  let str = "";
  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const rest = whole % 1000;
  if (crore) str += three(crore) + " Crore ";
  if (lakh) str += three(lakh) + " Lakh ";
  if (thousand) str += three(thousand) + " Thousand ";
  if (rest) str += three(rest);
  str = str.trim() + " Rupees";
  if (paise) str += " and " + two(paise) + " Paise";
  return str + " Only";
}
