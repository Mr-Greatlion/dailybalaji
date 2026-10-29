import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NAMES = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];

export async function GET() {
  const dbVar = NAMES.find((n) => process.env[n] && /^postgres(ql)?:\/\//.test(process.env[n] as string)) || null;
  const present = NAMES.filter((n) => !!process.env[n]);
  if (!dbVar) {
    return NextResponse.json({ ok: false, db: "not-configured", envVarsPresent: present, hint: "Connect a Postgres database in Vercel → Storage, then redeploy." }, { status: 500 });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    const tables = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM information_schema.tables WHERE table_schema='public'`;
    return NextResponse.json({ ok: true, db: "up", using: dbVar, tables: Number(tables[0]?.n ?? 0), blob: !!process.env.BLOB_READ_WRITE_TOKEN, time: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, db: "down", using: dbVar, error: e.message }, { status: 500 });
  }
}
