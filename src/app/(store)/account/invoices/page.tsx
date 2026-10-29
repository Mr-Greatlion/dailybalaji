import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fmtDate, orderStatusColor } from "@/lib/utils";
import { inr } from "@/lib/pricing";

export const metadata = { title: "My invoices" };

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const customer = await prisma.customer.findUnique({ where: { userId: session.id } });
  const invoices = customer ? await prisma.invoice.findMany({ where: { customerId: customer.id }, orderBy: { date: "desc" } }) : [];
  return (
    <div className="container-x py-6">
      <h1 className="text-2xl font-bold">My invoices</h1>
      {invoices.length === 0 ? (
        <div className="card mt-5 p-10 text-center text-gray-500">No invoices yet.</div>
      ) : (
        <div className="card mt-5 divide-y">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoice/${inv.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div><p className="font-semibold">{inv.invoiceNo}</p><p className="text-xs text-gray-500">{fmtDate(inv.date)} • {inv.type === "GST" ? "GST Tax Invoice" : "Bill of Supply"}</p></div>
              <div className="text-right"><p className="font-bold">{inr(inv.total)}</p><span className={`badge ${orderStatusColor(inv.paymentStatus)}`}>{inv.paymentStatus}</span></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
