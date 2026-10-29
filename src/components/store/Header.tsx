"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Home, LayoutGrid, Search, ShoppingCart, User, Menu, X, Phone } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

type Props = {
  siteName: string;
  announcement?: string;
  phone?: string;
  categories: { name: string; slug: string }[];
  user: { name: string; role: string } | null;
};

export function Header({ siteName, announcement, phone, categories, user }: Props) {
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/shop?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  const navActive = (p: string) => (pathname === p ? "text-brand-700" : "text-gray-500");

  return (
    <>
      {announcement && (
        <div className="bg-brand-800 px-4 py-1.5 text-center text-xs font-medium text-brand-50 sm:text-sm">{announcement}</div>
      )}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="container-x flex h-16 items-center gap-3">
          <button onClick={() => setOpen(true)} className="btn-ghost -ml-2 px-2 lg:hidden" aria-label="Menu">
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white">B</span>
            <span className="text-lg font-extrabold tracking-tight text-brand-800">{siteName}</span>
          </Link>

          <form onSubmit={submitSearch} className="ml-4 hidden flex-1 lg:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search cheese, ghee, paneer, butter..."
                className="input pl-9"
              />
            </div>
          </form>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            <Link href="/shop" className="btn-ghost">Shop</Link>
            <Link href="/about" className="btn-ghost">About</Link>
            <Link href="/contact" className="btn-ghost">Contact</Link>
            {user?.role === "ADMIN" && <Link href="/admin" className="btn-secondary">Admin</Link>}
            <Link href={user ? "/account" : "/login"} className="btn-ghost">
              <User className="h-5 w-5" /> {user ? user.name.split(" ")[0] : "Login"}
            </Link>
          </nav>

          <Link href="/cart" className="relative ml-auto btn-ghost px-2 lg:ml-0" aria-label="Cart">
            <ShoppingCart className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-saffron px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>

        <div className="container-x pb-2 lg:hidden">
          <form onSubmit={submitSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="input pl-9" />
          </form>
        </div>

        <div className="hidden border-t border-gray-100 lg:block">
          <div className="container-x flex gap-5 overflow-x-auto py-2 text-sm font-medium text-gray-600 scrollbar-none">
            <Link href="/shop" className="whitespace-nowrap hover:text-brand-700">All products</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} className="whitespace-nowrap hover:text-brand-700">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-bold text-brand-800">{siteName}</span>
              <button onClick={() => setOpen(false)} className="btn-ghost px-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <p className="label px-2">Categories</p>
              <Link href="/shop" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-brand-50">All products</Link>
              {categories.map((c) => (
                <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-brand-50">
                  {c.name}
                </Link>
              ))}
              <p className="label mt-4 px-2">More</p>
              <Link href="/about" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-brand-50">About us</Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-brand-50">Contact</Link>
              <Link href="/terms" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-brand-50">Terms & Conditions</Link>
              {user?.role === "ADMIN" && (
                <Link href="/admin" onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white">Admin panel</Link>
              )}
            </div>
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-2 border-t px-4 py-3 text-sm font-medium text-brand-700">
                <Phone className="h-4 w-4" /> Call {phone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <Link href="/" className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${navActive("/")}`}><Home className="h-5 w-5" />Home</Link>
        <Link href="/shop" className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${navActive("/shop")}`}><LayoutGrid className="h-5 w-5" />Shop</Link>
        <Link href="/cart" className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${navActive("/cart")}`}>
          <ShoppingCart className="h-5 w-5" />Cart
          {count > 0 && <span className="absolute right-5 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-saffron px-1 text-[10px] font-bold text-white">{count}</span>}
        </Link>
        <Link href={user ? "/account" : "/login"} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${navActive("/account")}`}><User className="h-5 w-5" />{user ? "Account" : "Login"}</Link>
      </nav>
    </>
  );
}
