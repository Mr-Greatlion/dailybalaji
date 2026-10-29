export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export function fmtDateTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

export const UNITS = ["pc", "kg", "g", "ltr", "ml", "box", "pkt", "dozen", "bag"];
export const GST_RATES = [0, 5, 12, 18, 28];

export function num(v: FormDataEntryValue | null | undefined, fallback = 0): number {
  const n = parseFloat(String(v ?? ""));
  return isNaN(n) ? fallback : n;
}
export function int(v: FormDataEntryValue | null | undefined, fallback = 0): number {
  const n = parseInt(String(v ?? ""), 10);
  return isNaN(n) ? fallback : n;
}
export function str(v: FormDataEntryValue | null | undefined): string {
  return String(v ?? "").trim();
}
export function optStr(v: FormDataEntryValue | null | undefined): string | null {
  const s = str(v);
  return s ? s : null;
}

export function orderStatusColor(s: string) {
  switch (s) {
    case "PENDING": return "bg-amber-100 text-amber-800";
    case "CONFIRMED": return "bg-blue-100 text-blue-800";
    case "PACKED": return "bg-indigo-100 text-indigo-800";
    case "SHIPPED": return "bg-purple-100 text-purple-800";
    case "DELIVERED": return "bg-green-100 text-green-800";
    case "CANCELLED": return "bg-red-100 text-red-800";
    case "PAID": return "bg-green-100 text-green-800";
    case "FAILED": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}
