"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Package, Boxes, Truck, Users, ShoppingBag, ReceiptText, Settings, Menu, X, LogOut, Store, Tags, ClipboardList } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/billing", label: "Billing / Invoices", icon: ReceiptText },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/purchases", label: "Purchases", icon: ClipboardList },
  { href: "/admin/vendors", label: "Vendors", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (n: (typeof NAV)[number]) => (n.exact ? pathname === n.href : pathname.startsWith(n.href));

  const Nav = () => (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive(n) ? "bg-brand-600 text-white" : "text-gray-700 hover:bg-brand-50"}`}>
          <n.icon className="h-5 w-5" /> {n.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-black text-white">B</span>
          <div><p className="text-sm font-bold leading-tight">Balaji Agencies</p><p className="text-[11px] text-gray-500">Admin panel</p></div>
        </div>
        <Nav />
        <div className="border-t p-3">
          <Link href="/" className="btn-ghost w-full justify-start"><Store className="h-4 w-4" /> View store</Link>
          <form action="/api/auth/logout" method="post"><button className="btn-ghost w-full justify-start text-red-600"><LogOut className="h-4 w-4" /> Logout</button></form>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-card">
            <div className="flex h-14 items-center justify-between border-b px-4"><p className="font-bold">Admin menu</p><button onClick={() => setOpen(false)} className="btn-ghost px-2"><X className="h-5 w-5" /></button></div>
            <Nav />
            <div className="border-t p-3">
              <Link href="/" className="btn-ghost w-full justify-start"><Store className="h-4 w-4" /> View store</Link>
              <form action="/api/auth/logout" method="post"><button className="btn-ghost w-full justify-start text-red-600"><LogOut className="h-4 w-4" /> Logout</button></form>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:h-16 lg:px-6">
          <button onClick={() => setOpen(true)} className="btn-ghost -ml-2 px-2 lg:hidden"><Menu className="h-6 w-6" /></button>
          <p className="font-bold lg:hidden">Admin</p>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-gray-600 sm:inline">Hi, {userName}</span>
            <Link href="/admin/billing/new" className="btn-primary py-2">+ New bill</Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
