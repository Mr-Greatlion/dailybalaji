import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up", time: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, db: "down", error: e.message }, { status: 500 });
  }
}
