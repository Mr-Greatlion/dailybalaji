import nodemailer from "nodemailer";

function transporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const t = transporter();
  if (!t) {
    console.warn("[mail] SMTP not configured; skipping email to", to, subject);
    return false;
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html });
    return true;
  } catch (e) {
    console.error("[mail] send failed", e);
    return false;
  }
}

export function wrapEmail(title: string, body: string) {
  const site = process.env.NEXT_PUBLIC_SITE_NAME || "Daily Balaji";
  return `<!doctype html><html><body style="margin:0;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#237d4e;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold">${site}</div>
    <div style="padding:24px"><h2 style="margin:0 0 12px;font-size:18px">${title}</h2>${body}</div>
    <div style="padding:14px 24px;background:#f9fafb;font-size:12px;color:#6b7280">This is an automated message from ${site}.</div>
  </div></body></html>`;
}

export function orderEmailRows(items: { name: string; qty: number; unitPrice: number; amount: number }[], subtotal: number, delivery: number, total: number) {
  const fmt = (n: number) => "₹" + n.toFixed(2);
  const rows = items
    .map((i) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${fmt(i.unitPrice)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${fmt(i.amount)}</td></tr>`)
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="background:#f0faf4"><th style="text-align:left;padding:8px">Item</th><th style="padding:8px">Qty</th><th style="text-align:right;padding:8px">Rate</th><th style="text-align:right;padding:8px">Amount</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td colspan="3" style="text-align:right;padding:6px 8px">Subtotal</td><td style="text-align:right;padding:6px 8px">${fmt(subtotal)}</td></tr>
  <tr><td colspan="3" style="text-align:right;padding:6px 8px">Delivery</td><td style="text-align:right;padding:6px 8px">${fmt(delivery)}</td></tr>
  <tr><td colspan="3" style="text-align:right;padding:8px;font-weight:bold">Total</td><td style="text-align:right;padding:8px;font-weight:bold">${fmt(total)}</td></tr></tfoot></table>`;
}
