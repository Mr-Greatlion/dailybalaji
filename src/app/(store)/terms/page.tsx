import { getSettings } from "@/lib/settings";

export const metadata = { title: "Terms & conditions" };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-3xl font-bold">Terms & Conditions</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-gray-700">
        <p>By placing an order on this website you agree to the following terms with {s.company_name} ("we", "us").</p>
        <h2 className="font-bold">1. Orders & pricing</h2>
        <p>All prices are in Indian Rupees and inclusive of applicable GST unless stated otherwise. Prices and stock may change without notice. An order is confirmed only after we accept it; we may cancel an order if a product is unavailable or priced incorrectly, in which case any payment made will be refunded in full.</p>
        <h2 className="font-bold">2. Delivery</h2>
        <p>We deliver within Chennai and nearby areas. Delivery charges, if any, are shown at checkout. Delivery times are estimates. Please ensure someone is available to receive perishable dairy items; we are not responsible for spoilage after a successful delivery.</p>
        <h2 className="font-bold">3. Payments</h2>
        <p>We accept online payments through Razorpay (UPI, cards, net banking), cash/UPI on delivery, and bank transfer for business accounts. Bank transfer orders are dispatched after the payment is received.</p>
        <h2 className="font-bold">4. Returns & refunds</h2>
        <p>Perishable goods cannot be returned once delivered, except where the product is damaged, expired or incorrect at the time of delivery. Please report such issues within 24 hours with a photo; we will replace the item or refund the amount to the original payment method within 5–7 working days.</p>
        <h2 className="font-bold">5. GST invoices</h2>
        <p>Business customers who provide a valid GSTIN receive a GST tax invoice. It is the customer's responsibility to ensure the GSTIN and billing details provided are correct.</p>
        <h2 className="font-bold">6. Jurisdiction</h2>
        <p>These terms are governed by the laws of India. Any dispute is subject to the exclusive jurisdiction of the courts in Chennai, Tamil Nadu.</p>
        <p className="text-gray-500">{s.company_name}, {s.company_address}. GSTIN {s.company_gstin}. FSSAI {s.company_fssai}.</p>
      </div>
    </div>
  );
}
