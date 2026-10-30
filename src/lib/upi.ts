import QRCode from "qrcode";

/** Build a UPI deep link. Amount/ref optional (static QR when omitted). */
export function upiLink(opts: { pa: string; pn: string; am?: number; tn?: string }) {
  const p = new URLSearchParams();
  p.set("pa", opts.pa.trim());
  p.set("pn", opts.pn.trim().slice(0, 40));
  if (opts.am && opts.am > 0) p.set("am", opts.am.toFixed(2));
  p.set("cu", "INR");
  if (opts.tn) p.set("tn", opts.tn.slice(0, 40));
  return `upi://pay?${p.toString()}`;
}

/** Inline SVG string for a QR code (no external requests, prints cleanly). */
export async function qrSvg(text: string, size = 160): Promise<string> {
  const svg = await QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M", width: size });
  return svg;
}

export async function upiQrSvg(opts: { pa: string; pn: string; am?: number; tn?: string }, size = 160) {
  if (!opts.pa) return null;
  return qrSvg(upiLink(opts), size);
}
