import { prisma } from "@/lib/prisma";
import { CustomersClient } from "@/components/admin/CustomersClient";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const customers = await prisma.customer.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { company: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { gstin: { contains: q, mode: "insensitive" } }] } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { invoices: true, orders: true } }, invoices: { select: { total: true, paymentStatus: true } }, orders: { select: { total: true, status: true } } },
  });
  return (
    <div>
      <h1 className="admin-section-title">Customers</h1>
      <p className="text-sm text-gray-500">Retail and business customers. Added automatically from online orders, or add manually for offline billing.</p>
      <form className="mt-3"><input name="q" defaultValue={q} placeholder="Search name / company / phone / GSTIN" className="input max-w-md" /></form>
      <CustomersClient
        customers={customers.map((c) => ({
          id: c.id, name: c.name, company: c.company, type: c.type, gstin: c.gstin, phone: c.phone, email: c.email, address: c.address, city: c.city, state: c.state, pincode: c.pincode, notes: c.notes,
          invoiceCount: c._count.invoices, orderCount: c._count.orders,
          billed: c.invoices.reduce((a, b) => a + b.total, 0), unpaid: c.invoices.filter((i) => i.paymentStatus === "PENDING").reduce((a, b) => a + b.total, 0),
        }))}
      />
    </div>
  );
}
