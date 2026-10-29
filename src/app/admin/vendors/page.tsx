import { prisma } from "@/lib/prisma";
import { VendorsClient } from "@/components/admin/VendorsClient";

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { purchases: true, products: true } }, purchases: { select: { total: true } } } });
  return (
    <div>
      <h1 className="admin-section-title">Vendors / Dealers</h1>
      <p className="text-sm text-gray-500">Suppliers you buy from. Saved once, reused in every purchase entry.</p>
      <VendorsClient vendors={vendors.map((v) => ({ ...v, purchaseCount: v._count.purchases, productCount: v._count.products, totalBought: v.purchases.reduce((a, b) => a + b.total, 0) }))} />
    </div>
  );
}
