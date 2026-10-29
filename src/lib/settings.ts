import { prisma } from "./prisma";

export const DEFAULT_SETTINGS: Record<string, string> = {
  company_name: "Balaji Agencies",
  company_tagline: "Fresh dairy & grocery, delivered daily",
  company_address: "31/23-A Kanniyamman Kovil Street, Shenoy Nagar, Chennai - 600030",
  company_state: "Tamil Nadu",
  company_state_code: "33",
  company_gstin: "33BXMPP3301H1ZN",
  company_pan: "BXMPP3301H",
  company_fssai: "12422002001973",
  company_phone: "9080052974",
  company_email: "",
  company_whatsapp: "9080052974",
  bank_name: "Indian Overseas Bank",
  bank_branch: "Loyola College Chennai Branch (1712)",
  bank_account: "",
  bank_ifsc: "IOBA0001712",
  bank_holder: "M/S Balaji Agencies",
  margin_percent: "5",
  delivery_charge: "40",
  free_delivery_above: "0",
  min_order: "0",
  invoice_prefix: "BA",
  invoice_terms: "Goods once sold will not be taken back. Subject to Chennai jurisdiction. E & O.E.",
  announcement: "Free same-day delivery in Chennai on orders above ₹1000",
  hero_title: "Fresh dairy & daily groceries at wholesale-honest prices",
  hero_subtitle: "Cheese, ghee, paneer, butter and everyday essentials from trusted brands. Order online — we deliver across Chennai.",
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export async function getMargin(): Promise<number> {
  const v = parseFloat(await getSetting("margin_percent"));
  return isNaN(v) ? 5 : v;
}

export async function setSettings(values: Record<string, string>) {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } }),
    ),
  );
}
