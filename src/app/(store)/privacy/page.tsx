import { getSettings } from "@/lib/settings";

export const metadata = { title: "Privacy & refund policy" };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-3xl font-bold">Privacy & Refund Policy</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-gray-700">
        <h2 className="font-bold">Privacy</h2>
        <p>We collect only the information needed to process and deliver your order — name, phone number, email, delivery address and, for business customers, GSTIN. We do not sell or share your data with third parties except our delivery and payment partners (such as Razorpay) as required to fulfil your order. Online card and UPI details are handled entirely by the payment gateway and are never stored on our servers.</p>
        <p>You can request to view, update or delete your account data by contacting us at {s.company_phone}.</p>
        <h2 className="font-bold">Cancellations</h2>
        <p>You may cancel an order before it is dispatched by calling or messaging us. Prepaid orders cancelled before dispatch are refunded in full.</p>
        <h2 className="font-bold">Refunds</h2>
        <p>Approved refunds are processed to the original payment method within 5–7 working days. For cash-on-delivery orders, refunds are made by UPI or bank transfer.</p>
        <h2 className="font-bold">Shipping</h2>
        <p>Orders are typically delivered the same or next working day within Chennai. Delivery charges are displayed at checkout before you pay.</p>
      </div>
    </div>
  );
}
