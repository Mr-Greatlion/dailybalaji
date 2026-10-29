import Link from "next/link";
import { ShoppingBag, IndianRupee, Package, AlertTriangle, Users, ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/pricing";
import { fmtDate, orderStatusColor } from "@/lib/utils";

export default async function Dashboard() {
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const [pendingOrders, todayOrders, monthSales, monthInvoices, lowStock, customers, recentOrders, unpaidInvoices, products] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfMonth }, status: { not: "CANCELLED" } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, _count: true, where: { date: { gte: startOfMonth } } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { stock: "asc" }, take: 50 }).then((ps) => ps.filter((p) => p.stock <= p.lowStockAt)),
    prisma.customer.count(),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: true } }),
    prisma.invoice.aggregate({ _sum: { total: true }, _count: true, where: { paymentStatus: "PENDING" } }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  const stats = [
    { label: "Pending orders", value: String(pendingOrders), icon: ShoppingBag, href: "/admin/orders?status=PENDING", tone: "bg-amber-50 text-amber-700" },
    { label: "Orders today", value: String(todayOrders), icon: ShoppingBag, href: "/admin/orders", tone: "bg-blue-50 text-blue-700" },
    { label: "Online sales this month", value: inr(monthSales._sum.total || 0), icon: IndianRupee, href: "/admin/orders", tone: "bg-brand-50 text-brand-700" },
    { label: "Invoices this month", value: `${monthInvoices._count} • ${inr(monthInvoices._sum.total || 0)}`, icon: ReceiptText, href: "/admin/billing", tone: "bg-purple-50 text-purple-700" },
    { label: "Unpaid invoices", value: `${unpaidInvoices._count} • ${inr(unpaidInvoices._sum.total || 0)}`, icon: ReceiptText, href: "/admin/billing?status=PENDING", tone: "bg-red-50 text-red-700" },
    { label: "Low stock items", value: String(lowStock.length), icon: AlertTriangle, href: "/admin/inventory?low=1", tone: "bg-orange-50 text-orange-700" },
    { label: "Active products", value: String(products), icon: Package, href: "/admin/products", tone: "bg-gray-100 text-gray-700" },
    { label: "Customers", value: String(customers), icon: Users, href: "/admin/customers", tone: "bg-teal-50 text-teal-700" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="admin-section-title">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/billing/new" className="btn-primary">+ New bill</Link>
          <Link href="/admin/purchases/new" className="btn-secondary">+ Purchase entry</Link>
          <Link href="/admin/products/new" className="btn-secondary">+ Product</Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((st) => (
          <Link key={st.label} href={st.href} className="card p-4 hover:shadow-card">
            <div className={`inline-grid h-9 w-9 place-items-center rounded-xl ${st.tone}`}><st.icon className="h-5 w-5" /></div>
            <p className="mt-3 text-lg font-extrabold leading-tight">{st.value}</p>
            <p className="text-xs text-gray-500">{st.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="font-bold">Recent orders</h2><Link href="/admin/orders" className="text-sm text-brand-700">All orders</Link></div>
          {recentOrders.length === 0 ? <p className="p-6 text-sm text-gray-500">No orders yet.</p> : (
            <div className="divide-y">
              {recentOrders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="font-semibold">{o.orderNo} <span className="font-normal text-gray-500">• {o.shipName}</span></p>
                    <p className="truncate text-xs text-gray-500">{fmtDate(o.createdAt)} • {o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p>
                  </div>
                  <div className="shrink-0 text-right"><p className="font-bold">{inr(o.total)}</p><span className={`badge ${orderStatusColor(o.status)}`}>{o.status}</span></div>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="card">
          <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="font-bold">Low stock</h2><Link href="/admin/inventory" className="text-sm text-brand-700">Inventory</Link></div>
          {lowStock.length === 0 ? <p className="p-6 text-sm text-gray-500">All stocked up 👍</p> : (
            <div className="divide-y">
              {lowStock.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm"><span className="truncate">{p.name}</span><span className={`badge ${p.stock <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{p.stock} {p.unit}</span></div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
