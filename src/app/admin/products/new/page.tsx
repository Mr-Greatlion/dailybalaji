import { prisma } from "@/lib/prisma";
import { getMargin } from "@/lib/settings";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [categories, vendors, margin] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    getMargin(),
  ]);
  return (
    <div>
      <h1 className="admin-section-title">Add product</h1>
      <ProductForm categories={categories} vendors={vendors} globalMargin={margin} />
    </div>
  );
}
