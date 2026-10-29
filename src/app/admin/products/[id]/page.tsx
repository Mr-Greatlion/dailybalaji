import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMargin } from "@/lib/settings";
import { ProductForm } from "@/components/admin/ProductForm";
import { fmtDateTime } from "@/lib/utils";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, vendors, margin, movements] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    getMargin(),
    prisma.stockMovement.findMany({ where: { productId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  if (!product) notFound();
  return (
    <div>
      <h1 className="admin-section-title">Edit product</h1>
      <ProductForm product={product} categories={categories} vendors={vendors} globalMargin={margin} />
      <section className="card mt-6">
        <div className="border-b px-4 py-3 font-bold">Stock history</div>
        {movements.length === 0 ? <p className="p-4 text-sm text-gray-500">No movements yet.</p> : (
          <table className="table-base"><thead><tr><th>Date</th><th>Reason</th><th className="text-right">Qty</th></tr></thead>
            <tbody>{movements.map((m) => <tr key={m.id}><td className="text-gray-500">{fmtDateTime(m.createdAt)}</td><td>{m.reason}</td><td className={`text-right font-semibold ${m.qty > 0 ? "text-green-700" : "text-red-600"}`}>{m.qty > 0 ? "+" : ""}{m.qty}</td></tr>)}</tbody>
          </table>
        )}
      </section>
    </div>
  );
}
