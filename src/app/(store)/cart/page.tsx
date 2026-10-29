import { getSettings } from "@/lib/settings";
import { CartView } from "@/components/store/CartView";

export const metadata = { title: "Your cart" };

export default async function CartPage() {
  const s = await getSettings();
  return (
    <div className="container-x py-6">
      <h1 className="text-2xl font-bold">Your cart</h1>
      <CartView deliveryCharge={parseFloat(s.delivery_charge) || 0} freeAbove={parseFloat(s.free_delivery_above) || 0} minOrder={parseFloat(s.min_order) || 0} />
    </div>
  );
}
