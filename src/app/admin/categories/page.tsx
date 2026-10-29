import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "@/components/admin/CategoriesClient";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <div>
      <h1 className="admin-section-title">Categories</h1>
      <CategoriesClient categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, image: c.image, sortOrder: c.sortOrder, count: c._count.products }))} />
    </div>
  );
}
