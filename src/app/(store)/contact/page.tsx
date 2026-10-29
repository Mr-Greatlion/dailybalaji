import { MapPin, Phone, Mail, MessageCircle, Clock } from "lucide-react";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Contact us" };

export default async function ContactPage() {
  const s = await getSettings();
  const wa = (s.company_whatsapp || s.company_phone || "").replace(/\D/g, "").slice(-10);
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-3xl font-bold">Contact us</h1>
      <p className="mt-2 text-gray-600">For bulk orders, business accounts or any help with your order — reach us any way you like.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a href={`tel:${s.company_phone}`} className="card flex items-center gap-3 p-5 hover:shadow-card"><Phone className="h-6 w-6 text-brand-600" /><div><p className="font-semibold">Call us</p><p className="text-sm text-gray-600">{s.company_phone}</p></div></a>
        {wa && <a href={`https://wa.me/91${wa}`} target="_blank" rel="noreferrer" className="card flex items-center gap-3 p-5 hover:shadow-card"><MessageCircle className="h-6 w-6 text-[#25D366]" /><div><p className="font-semibold">WhatsApp</p><p className="text-sm text-gray-600">Chat & order instantly</p></div></a>}
        {s.company_email && <a href={`mailto:${s.company_email}`} className="card flex items-center gap-3 p-5 hover:shadow-card"><Mail className="h-6 w-6 text-brand-600" /><div><p className="font-semibold">Email</p><p className="text-sm text-gray-600">{s.company_email}</p></div></a>}
        <div className="card flex items-center gap-3 p-5"><Clock className="h-6 w-6 text-brand-600" /><div><p className="font-semibold">Hours</p><p className="text-sm text-gray-600">Mon–Sat, 9 AM – 8 PM</p></div></div>
        <div className="card flex items-start gap-3 p-5 sm:col-span-2"><MapPin className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" /><div><p className="font-semibold">Address</p><p className="text-sm text-gray-600">{s.company_address}</p></div></div>
      </div>
    </div>
  );
}
