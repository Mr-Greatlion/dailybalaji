import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/pricing";
import { fmtDateTime, orderStatusColor } from "@/lib/utils";

const STATUSES = ["", "PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const where: Prisma.OrderWhereInput = {};
  if (sp.status) where.status = sp.status as any;
  if (sp.q) where.OR = [{ orderNo: { contains: sp.q, mode: "insensitive" } }, { shipName: { contains: sp.q, mode: "insensitive" } }, { shipPhone: { contains: sp.q } }];
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, include: { items: true, invoice: { select: { invoiceNo: true } } }, take: 200 });
  return (
    <div>
      <h1 className="admin-section-title">Online orders</h1>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUSES.map((st) => <Link key={st} href={st ? `/admin/orders?status=${st}` : "/admin/orders"} className={`badge whitespace-nowrap px-3 py-1.5 ${(sp.status || "") === st ? "bg-brand-600 text-white" : "bg-white ring-1 ring-gray-200"}`}>{st || "All"}</Link>)}
      </div>
      <form className="mt-3"><input name="q" defaultValue={sp.q} placeholder="Search order no / name / phone" className="input max-w-md" /></form>
      <div className="card mt-4 overflow-x-auto">
        <table className="table-base min-w-[800px]"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th className="text-right">Total</th><th className="text-center">Payment</th><th className="text-center">Status</th><th>Invoice</th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">No orders.</td></tr>}
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700">{o.orderNo}</Link><p className="text-xs text-gray-500">{fmtDateTime(o.createdAt)}</p></td>
                <td><p className="font-medium">{o.shipName}</p><p className="text-xs text-gray-500">{o.shipPhone}{o.gstin ? ` • ${o.gstin}` : ""}</p></td>
                <td className="max-w-xs truncate text-sm text-gray-600">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</td>
                <td className="text-right font-semibold">{inr(o.total)}</td>
                <td className="text-center"><span className={`badge ${orderStatusColor(o.paymentStatus)}`}>{o.paymentStatus}</span><p className="text-[10px] text-gray-500">{o.paymentMethod}</p></td>
                <td className="text-center"><span className={`badge ${orderStatusColor(o.status)}`}>{o.status}</span></td>
                <td className="text-xs">{o.invoice?.invoiceNo || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
