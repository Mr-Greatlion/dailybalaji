import { getSettings } from "@/lib/settings";

export const metadata = { title: "About us" };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-3xl font-bold">About {s.company_name}</h1>
      <div className="prose prose-sm mt-6 max-w-none text-gray-700">
        <p>{s.company_name} is a Chennai-based dairy and grocery trading agency. We source genuine products — cheese, ghee, paneer, butter and everyday essentials — directly from authorised dealers of trusted brands and supply them to hotels, restaurants, bakeries, retail shops and households across the city.</p>
        <p>Every business order comes with a proper GST tax invoice, and every household order is delivered fresh and fast. Our pricing is transparent: a small fixed margin over the dealer price, with GST clearly shown.</p>
        <h2 className="mt-6 text-lg font-bold">Why buy from us</h2>
        <ul className="list-disc pl-5">
          <li>FSSAI licensed (Lic. No. {s.company_fssai}) and GST registered ({s.company_gstin})</li>
          <li>Genuine brands from authorised distributors — no grey-market stock</li>
          <li>Bulk and wholesale pricing for businesses</li>
          <li>Fast delivery across Chennai with cold-chain care for dairy</li>
        </ul>
        <h2 className="mt-6 text-lg font-bold">Visit us</h2>
        <p>{s.company_address}<br />Phone: {s.company_phone}</p>
      </div>
    </div>
  );
}
