import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runBootstrap } from "@/lib/bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-time setup endpoint. Call once after first deploy:
 *   GET /api/setup?key=<AUTH_SECRET>
 * Creates the admin user (ADMIN_EMAIL / ADMIN_PASSWORD env), company settings, categories, default vendor.
 * Safe to call again — it only adds what is missing.
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.AUTH_SECRET || key !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return NextResponse.json({ error: "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars first" }, { status: 400 });
  try {
    const log = await runBootstrap(prisma, { email, password });
    return NextResponse.json({ ok: true, log, login: "/login?admin=1" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
