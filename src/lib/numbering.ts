import { prisma } from "./prisma";
import { financialYear } from "./pricing";
import { getSetting } from "./settings";

/** Next invoice number: BA/2026-27/0001 */
export async function nextInvoiceNo(): Promise<string> {
  const prefix = (await getSetting("invoice_prefix")) || "BA";
  const fy = financialYear();
  const head = `${prefix}/${fy}/`;
  const last = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: head } },
    orderBy: { createdAt: "desc" },
    select: { invoiceNo: true },
  });
  const n = last ? parseInt(last.invoiceNo.slice(head.length), 10) + 1 : 1;
  return head + String(n).padStart(4, "0");
}

/** Next purchase number: PUR/2026-27/0001 */
export async function nextPurchaseNo(): Promise<string> {
  const head = `PUR/${financialYear()}/`;
  const last = await prisma.purchase.findFirst({
    where: { purchaseNo: { startsWith: head } },
    orderBy: { createdAt: "desc" },
    select: { purchaseNo: true },
  });
  const n = last ? parseInt(last.purchaseNo.slice(head.length), 10) + 1 : 1;
  return head + String(n).padStart(4, "0");
}

/** Order number: DB + yymmdd + 4 random digits */
export function newOrderNo(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `DB${ymd}${Math.floor(1000 + Math.random() * 9000)}`;
}
