import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const data = {
    name: String(b.name || "").trim(), phone: String(b.phone || "").trim(), email: String(b.email || "").trim() || null,
    type: b.type === "BUSINESS" ? ("BUSINESS" as const) : ("RETAIL" as const),
    company: b.type === "BUSINESS" ? String(b.company || "").trim() || null : null,
    gstin: b.type === "BUSINESS" ? String(b.gstin || "").toUpperCase().trim() || null : null,
    address: String(b.address || "").trim(), city: String(b.city || "").trim(), state: String(b.state || "Tamil Nadu"), pincode: String(b.pincode || "").trim(),
  };
  await prisma.customer.upsert({ where: { userId: session.id }, update: data, create: { ...data, userId: session.id } });
  await prisma.user.update({ where: { id: session.id }, data: { name: data.name, phone: data.phone } });
  return NextResponse.json({ ok: true });
}
