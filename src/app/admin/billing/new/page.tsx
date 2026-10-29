import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { BillingForm } from "@/components/admin/BillingForm";

export default async function NewBillPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const sp = await searchParams;
  const [customers, products, companyState] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, hsn: true, unit: true, sellPrice: true, gstRate: true, stock: true, packSize: true } }),
    getSetting("company_state"),
  ]);
  return (
    <div>
      <h1 className="admin-section-title">New bill</h1>
      <p className="text-sm text-gray-500">Pick the customer, add products — prices come from the pricing engine. Choose GST tax invoice or non-GST bill of supply.</p>
      <BillingForm
        customers={customers.map((c) => ({ id: c.id, name: c.name, company: c.company, phone: c.phone, gstin: c.gstin, state: c.state, type: c.type }))}
        products={products}
        companyState={companyState}
        initialCustomerId={sp.customer || ""}
      />
    </div>
  );
}
