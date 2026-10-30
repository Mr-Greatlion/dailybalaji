import { prisma } from "./prisma";
import { sendMail, wrapEmail, orderEmailRows } from "./mail";
import { getSettings } from "./settings";

/** Email customer + admin when a new order is placed. Never throws. */
export async function notifyNewOrder(orderId: string) {
  try {
    const [order, s] = await Promise.all([
      prisma.order.findUnique({ where: { id: orderId }, include: { items: true } }),
      getSettings(),
    ]);
    if (!order) return;
    const rows = orderEmailRows(order.items, order.subtotal, order.deliveryCharge, order.total);
    const addr = `${order.shipName}, ${order.shipAddress}, ${order.shipCity} - ${order.shipPincode}, ${order.shipState}. Ph: ${order.shipPhone}`;
    const pm = order.paymentMethod === "RAZORPAY" ? "Online payment" : order.paymentMethod === "COD" ? "Cash / UPI on delivery" : "Bank transfer";
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";

    if (order.shipEmail) {
      await sendMail(
        order.shipEmail,
        `Order ${order.orderNo} received — ${s.company_name}`,
        wrapEmail(
          `Thank you, ${order.shipName}!`,
          `<p>Your order <b>${order.orderNo}</b> has been received. We will confirm it shortly.</p>${rows}
          <p style="font-size:13px"><b>Payment:</b> ${pm}<br/><b>Deliver to:</b> ${addr}</p>
          ${order.paymentMethod !== "RAZORPAY" ? `<p style="font-size:13px;background:#f0faf4;padding:10px;border-radius:8px"><b>Pay by UPI / Bank</b><br/>${s.bank_upi ? `UPI ID: <b>${s.bank_upi}</b><br/>` : ""}${s.bank_holder}<br/>${s.bank_name}, ${s.bank_branch}<br/>${s.bank_account ? `A/c: ${s.bank_account}<br/>` : ""}IFSC: ${s.bank_ifsc}</p>` : ""}
          <p style="font-size:13px">Track your order: <a href="${site}/account/orders">${site}/account/orders</a></p>`,
        ),
      );
    }
    const adminTo = process.env.ADMIN_NOTIFY_EMAIL || s.company_email;
    if (adminTo) {
      await sendMail(
        adminTo,
        `🛒 New order ${order.orderNo} — ₹${order.total.toFixed(2)}`,
        wrapEmail(
          `New order ${order.orderNo}`,
          `${rows}<p style="font-size:13px"><b>Customer:</b> ${addr}${order.shipEmail ? `<br/><b>Email:</b> ${order.shipEmail}` : ""}${order.gstin ? `<br/><b>GSTIN:</b> ${order.gstin}` : ""}<br/><b>Payment:</b> ${pm} (${order.paymentStatus})${order.notes ? `<br/><b>Notes:</b> ${order.notes}` : ""}</p>
          <p><a href="${site}/admin/orders/${order.id}" style="background:#237d4e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open in admin</a></p>`,
        ),
      );
    }
  } catch (e) {
    console.error("[orders] notify failed", e);
  }
}

export async function notifyOrderStatus(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.shipEmail) return;
    const s = await getSettings();
    const msg: Record<string, string> = {
      CONFIRMED: "Your order has been confirmed and is being prepared.",
      PACKED: "Your order is packed and ready for dispatch.",
      SHIPPED: "Your order is out for delivery.",
      DELIVERED: "Your order has been delivered. Thank you for shopping with us!",
      CANCELLED: "Your order has been cancelled. If this is unexpected, please contact us.",
    };
    if (!msg[order.status]) return;
    await sendMail(order.shipEmail, `Order ${order.orderNo}: ${order.status.toLowerCase()} — ${s.company_name}`, wrapEmail(`Order ${order.orderNo} — ${order.status}`, `<p>${msg[order.status]}</p>`));
  } catch (e) {
    console.error("[orders] status notify failed", e);
  }
}
