import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setSettings, DEFAULT_SETTINGS } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Protected settings writer (admin session OR ?key=AUTH_SECRET).
 * GET /api/apply-settings?key=...&bank_account=...&bank_upi=...&free_delivery_above=2000
 * Only known setting keys are accepted. Values are stored in the database, never in code.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const key = u.searchParams.get("key");
  let authorized = !!process.env.AUTH_SECRET && key === process.env.AUTH_SECRET;
  if (!authorized) {
    try { await requireAdmin(); authorized = true; } catch { authorized = false; }
  }
  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const values: Record<string, string> = {};
  for (const [k, v] of u.searchParams.entries()) {
    if (k === "key") continue;
    if (!(k in DEFAULT_SETTINGS)) continue;
    values[k] = v.trim();
  }
  if (!Object.keys(values).length) return NextResponse.json({ error: "No valid settings given" }, { status: 400 });
  await setSettings(values);
  const masked = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, k === "bank_account" ? v.replace(/.(?=.{4})/g, "•") : v]));
  return NextResponse.json({ ok: true, updated: masked });
}
