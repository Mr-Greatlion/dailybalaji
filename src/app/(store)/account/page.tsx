import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, User, LogOut, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";
import { inr } from "@/lib/pricing";
import { orderStatusColor } from "@/lib/utils";
import { ProfileForm } from "@/components/store/ProfileForm";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const customer = await prisma.customer.findUnique({ where: { userId: session.id } });
  const recent = customer ? await prisma.order.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, take: 5 }) : [];

  return (
    <div className="container-x py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hi, {session.name.split(" ")[0]}</h1>
          <p className="text-sm text-gray-500">{session.email}</p>
        </div>
        <form action="/api/auth/logout" method="post"><button className="btn-ghost text-red-600"><LogOut className="h-4 w-4" /> Logout</button></form>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link href="/account/orders" className="card flex items-center gap-3 p-4 hover:shadow-card"><Package className="h-6 w-6 text-brand-600" /><div><p className="font-semibold">My orders</p><p className="text-xs text-gray-500">Track & view history</p></div></Link>
        <Link href="/account/invoices" className="card flex items-center gap-3 p-4 hover:shadow-card"><FileText className="h-6 w-6 text-brand-600" /><div><p className="font-semibold">Invoices</p><p className="text-xs text-gray-500">Download GST bills</p></div></Link>
        <a href="#profile" className="card flex items-center gap-3 p-4 hover:shadow-card"><User className="h-6 w-6 text-brand-600" /><div><p className="font-semibold">Profile</p><p className="text-xs text-gray-500">Address & GST details</p></div></a>
      </div>

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-bold">Recent orders</h2>
          <div className="card divide-y">
            {recent.map((o) => (
              <Link key={o.id} href={`/account/orders/${o.orderNo}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div><p className="font-semibold">{o.orderNo}</p><p className="text-xs text-gray-500">{fmtDate(o.createdAt)}</p></div>
                <div className="text-right"><p className="font-bold">{inr(o.total)}</p><span className={`badge ${orderStatusColor(o.status)}`}>{o.status}</span></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="profile" className="mt-8">
        <h2 className="mb-3 font-bold">Profile & delivery address</h2>
        <ProfileForm customer={customer ? { name: customer.name, phone: customer.phone, email: customer.email || "", company: customer.company || "", gstin: customer.gstin || "", type: customer.type, address: customer.address, city: customer.city, state: customer.state, pincode: customer.pincode } : null} />
      </section>
    </div>
  );
}
