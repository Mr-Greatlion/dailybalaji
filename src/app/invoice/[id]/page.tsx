import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";
import { PrintBar } from "@/components/invoice/PrintBar";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/invoice/${id}`);
  const [inv, s] = await Promise.all([
    prisma.invoice.findUnique({ where: { id }, include: { customer: true, items: true, order: { select: { orderNo: true } } } }),
    getSettings(),
  ]);
  if (!inv) notFound();
  if (session.role !== "ADMIN" && inv.customer.userId !== session.id) notFound();
  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-8">
      <PrintBar backHref={session.role === "ADMIN" ? "/admin/billing" : "/account/invoices"} />
      <div className="px-2 sm:px-4">
        <InvoiceDocument inv={inv} s={s} />
      </div>
    </div>
  );
}
