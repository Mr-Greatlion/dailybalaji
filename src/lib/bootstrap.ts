import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "./settings";

const CATEGORIES = ["Cheese", "Ghee & Butter", "Paneer", "Milk & Curd", "Cream", "Groceries"];
const SEED_SETTINGS: Record<string, string> = { ...DEFAULT_SETTINGS, free_delivery_above: "1000" };

/** Idempotent first-run setup: admin user, company settings, categories, default vendor. */
export async function runBootstrap(prisma: PrismaClient, admin: { email: string; password: string }) {
  const log: string[] = [];
  const email = admin.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    log.push(`admin exists: ${email}`);
  } else {
    await prisma.user.create({ data: { email, name: "Balaji Agencies Admin", password: await bcrypt.hash(admin.password, 10), role: "ADMIN" } });
    log.push(`admin created: ${email}`);
  }

  let n = 0;
  for (const [key, value] of Object.entries(SEED_SETTINGS)) {
    const r = await prisma.setting.findUnique({ where: { key } });
    if (!r) { await prisma.setting.create({ data: { key, value } }); n++; }
  }
  log.push(`settings added: ${n}`);

  let i = 0, c = 0;
  for (const name of CATEGORIES) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const r = await prisma.category.findUnique({ where: { slug } });
    if (!r) { await prisma.category.create({ data: { name, slug, sortOrder: i } }); c++; }
    i++;
  }
  log.push(`categories added: ${c}`);

  const vendorName = "Parag Milk Foods Ltd";
  if (!(await prisma.vendor.findFirst({ where: { name: vendorName } }))) {
    await prisma.vendor.create({ data: { name: vendorName, city: "Chennai", state: "Tamil Nadu", notes: "Dealer for Gowardhan / Go cheese, ghee, paneer" } });
    log.push(`vendor added: ${vendorName}`);
  }
  return log;
}
