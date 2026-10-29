import { prisma } from "@/lib/prisma";
import { getMargin } from "@/lib/settings";
import { PurchaseForm } from "@/components/admin/PurchaseForm";

export default async function NewPurchasePage() {
  const [vendors, products, margin] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, dbLanding: true, gstRate: true, stock: true, unit: true } }),
    getMargin(),
  ]);
  return (
    <div>
      <h1 className="admin-section-title">New purchase entry (stock in)</h1>
      <p className="text-sm text-gray-500">Enter the dealer's bill. Stock increases and, if ticked, each product's dealer price + sell price (margin {margin}%) update automatically.</p>
      <PurchaseForm vendors={vendors.map((v) => ({ id: v.id, name: v.name }))} products={products} margin={margin} />
    </div>
  );
}
