import { getSettings } from "@/lib/settings";
import { getSession, getCurrentCustomer } from "@/lib/auth";
import { CheckoutForm } from "@/components/store/CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [s, session, customer] = await Promise.all([getSettings(), getSession(), getCurrentCustomer()]);
  return (
    <div className="container-x py-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <CheckoutForm
        deliveryCharge={parseFloat(s.delivery_charge) || 0}
        freeAbove={parseFloat(s.free_delivery_above) || 0}
        razorpayKey={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""}
        bank={{ name: s.bank_name, branch: s.bank_branch, account: s.bank_account, ifsc: s.bank_ifsc, holder: s.bank_holder }}
        companyName={s.company_name}
        prefill={{
          name: customer?.name || session?.name || "",
          phone: customer?.phone || "",
          email: customer?.email || session?.email || "",
          address: customer?.address || "",
          city: customer?.city || "Chennai",
          state: customer?.state || "Tamil Nadu",
          pincode: customer?.pincode || "",
          gstin: customer?.gstin || "",
          company: customer?.company || "",
          isBusiness: customer?.type === "BUSINESS",
        }}
      />
    </div>
  );
}
