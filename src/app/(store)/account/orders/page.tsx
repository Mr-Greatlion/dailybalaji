import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fmtDate, orderStatusColor } from "@/lib/utils";
import { inr } from "@/lib/pricing";

export const metadata = { title: "My orders" };

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const customer = await prisma.customer.findUnique({ where: { userId: session.id } });
  const orders = customer ? await prisma.order.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, include: { items: true } }) : [];
  return (
    <div className="container-x py-6">
      <h1 className="text-2xl font-bold">My orders</h1>
      {orders.length === 0 ? (
        <div className="card mt-5 p-10 text-center text-gray-500">No orders yet. <Link href="/shop" className="text-brand-700">Start shopping</Link></div>
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.orderNo}`} className="card block p-4 hover:shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{o.orderNo}</p>
                  <p className="text-xs text-gray-500">{fmtDate(o.createdAt)} • {o.items.length} item{o.items.length === 1 ? "" : "s"}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-600">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold">{inr(o.total)}</p>
                  <span className={`badge ${orderStatusColor(o.status)}`}>{o.status}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
