import { getSettings } from "@/lib/settings";
import { upiLink, qrSvg } from "@/lib/upi";

export const dynamic = "force-dynamic";

/** GET /api/upi-qr?am=123.45&tn=DB2610301234  → SVG image of the UPI pay QR */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const s = await getSettings();
  if (!s.bank_upi) return new Response("UPI not configured", { status: 404 });
  const am = parseFloat(u.searchParams.get("am") || "");
  const tn = (u.searchParams.get("tn") || "").replace(/[^A-Za-z0-9 \-\/]/g, "").slice(0, 40);
  const svg = await qrSvg(upiLink({ pa: s.bank_upi, pn: s.bank_holder || s.company_name, am: isNaN(am) ? undefined : am, tn: tn || undefined }), 200);
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" } });
}
