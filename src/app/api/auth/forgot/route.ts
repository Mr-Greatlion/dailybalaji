import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendMail, wrapEmail } from "@/lib/mail";

/** POST { email } → sends 6-digit OTP. POST { email, otp, password } → resets password. */
export async function POST(req: Request) {
  const b = await req.json();
  const email = String(b.email || "").toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (b.otp && b.password) {
    if (!user || !user.resetToken || !user.resetExpires || user.resetExpires < new Date() || user.resetToken !== String(b.otp).trim()) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }
    if (String(b.password).length < 6) return NextResponse.json({ error: "Password min 6 characters" }, { status: 400 });
    await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(String(b.password)), resetToken: null, resetExpires: null } });
    return NextResponse.json({ ok: true });
  }

  // Always respond OK to avoid email enumeration
  if (user) {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.user.update({ where: { id: user.id }, data: { resetToken: otp, resetExpires: new Date(Date.now() + 15 * 60 * 1000) } });
    await sendMail(user.email, "Your password reset OTP", wrapEmail("Password reset", `<p>Your OTP is <b style="font-size:22px;letter-spacing:4px">${otp}</b>. It is valid for 15 minutes.</p><p>If you did not request this, ignore this email.</p>`));
  }
  return NextResponse.json({ ok: true });
}
