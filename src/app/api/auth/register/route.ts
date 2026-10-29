import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const b = await req.json();
  const email = String(b.email || "").toLowerCase().trim();
  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  const password = String(b.password || "");
  if (!email || !name || !phone || password.length < 6) return NextResponse.json({ error: "Fill all fields; password min 6 characters" }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "Email already registered. Please login." }, { status: 409 });

  const isBusiness = !!b.isBusiness;
  const user = await prisma.user.create({
    data: {
      email, name, phone, password: await hashPassword(password), role: "CUSTOMER",
      customer: {
        create: {
          name, phone, email, type: isBusiness ? "BUSINESS" : "RETAIL",
          company: isBusiness ? String(b.company || "").trim() || null : null,
          gstin: isBusiness ? String(b.gstin || "").toUpperCase().trim() || null : null,
          address: String(b.address || "").trim(), city: String(b.city || "Chennai").trim(), state: String(b.state || "Tamil Nadu"), pincode: String(b.pincode || "").trim(),
        },
      },
    },
  });
  await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role });
  return NextResponse.json({ ok: true });
}
