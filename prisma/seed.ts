import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const SETTINGS: Record<string, string> = {
  company_name: "Balaji Agencies",
  company_tagline: "Fresh dairy & grocery, delivered daily",
  company_address: "31/23-A Kanniyamman Kovil Street, Shenoy Nagar, Chennai - 600030",
  company_state: "Tamil Nadu",
  company_state_code: "33",
  company_gstin: "33BXMPP3301H1ZN",
  company_pan: "BXMPP3301H",
  company_fssai: "12422002001973",
  company_phone: "9080052974",
  company_whatsapp: "9080052974",
  company_email: "",
  bank_name: "Indian Overseas Bank",
  bank_branch: "Loyola College Chennai Branch (1712)",
  bank_account: "",
  bank_ifsc: "IOBA0001712",
  bank_holder: "M/S Balaji Agencies",
  margin_percent: "5",
  delivery_charge: "40",
  free_delivery_above: "1000",
  min_order: "0",
  invoice_prefix: "BA",
  invoice_terms: "Goods once sold will not be taken back. Subject to Chennai jurisdiction. E & O.E.",
  announcement: "Free same-day delivery in Chennai on orders above ₹1000",
  hero_title: "Fresh dairy & daily groceries at wholesale-honest prices",
  hero_subtitle: "Cheese, ghee, paneer, butter and everyday essentials from trusted brands. Order online — we deliver across Chennai.",
};

const CATEGORIES = ["Cheese", "Ghee & Butter", "Paneer", "Milk & Curd", "Cream", "Groceries"];

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@dailybalaji.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe@123";
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, name: "Balaji Agencies Admin", password: await bcrypt.hash(password, 10), role: "ADMIN" },
  });
  console.log("Admin user:", email);

  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("Settings seeded");

  let i = 0;
  for (const name of CATEGORIES) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug, sortOrder: i++ } });
  }
  console.log("Categories seeded");

  const vendorName = "Parag Milk Foods Ltd";
  const existing = await prisma.vendor.findFirst({ where: { name: vendorName } });
  if (!existing) {
    await prisma.vendor.create({ data: { name: vendorName, contact: "", phone: "", address: "", city: "Chennai", state: "Tamil Nadu", notes: "Dealer for Gowardhan / Go cheese, ghee, paneer" } });
    console.log("Vendor seeded:", vendorName);
  }
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
