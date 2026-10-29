import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";

export function Footer({ s }: { s: Record<string, string> }) {
  const wa = (s.company_whatsapp || s.company_phone || "").replace(/\D/g, "");
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white pb-20 lg:pb-0">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white">B</span>
            <span className="text-lg font-extrabold text-brand-800">{s.company_name}</span>
          </div>
          <p className="mt-3 text-sm text-gray-600">{s.company_tagline}</p>
          {s.company_fssai && <p className="mt-2 text-xs text-gray-500">FSSAI Lic. No. {s.company_fssai}</p>}
          {s.company_gstin && <p className="text-xs text-gray-500">GSTIN {s.company_gstin}</p>}
        </div>
        <div>
          <p className="label">Shop</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/shop" className="hover:text-brand-700">All products</Link></li>
            <li><Link href="/cart" className="hover:text-brand-700">Cart</Link></li>
            <li><Link href="/account" className="hover:text-brand-700">My account</Link></li>
            <li><Link href="/account/orders" className="hover:text-brand-700">Track orders</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">Company</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/about" className="hover:text-brand-700">About us</Link></li>
            <li><Link href="/contact" className="hover:text-brand-700">Contact</Link></li>
            <li><Link href="/terms" className="hover:text-brand-700">Terms & conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-700">Privacy & refund policy</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">Reach us</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{s.company_address}</li>
            {s.company_phone && <li className="flex gap-2"><Phone className="h-4 w-4 text-brand-600" /><a href={`tel:${s.company_phone}`}>{s.company_phone}</a></li>}
            {wa && <li className="flex gap-2"><MessageCircle className="h-4 w-4 text-brand-600" /><a href={`https://wa.me/91${wa.slice(-10)}`} target="_blank" rel="noreferrer">WhatsApp us</a></li>}
            {s.company_email && <li className="flex gap-2"><Mail className="h-4 w-4 text-brand-600" /><a href={`mailto:${s.company_email}`}>{s.company_email}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {s.company_name}. All rights reserved.
      </div>
    </footer>
  );
}
