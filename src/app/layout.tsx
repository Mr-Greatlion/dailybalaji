import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { Toaster } from "@/components/ui/Toaster";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Daily Balaji";

export const metadata: Metadata = {
  title: { default: `${siteName} — Fresh Dairy & Grocery Delivery in Chennai`, template: `%s | ${siteName}` },
  description:
    "Order cheese, ghee, paneer, butter and daily groceries online from Balaji Agencies. Wholesale-honest prices, GST invoices for businesses, fast delivery across Chennai.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dailybalaji.com"),
  openGraph: { type: "website", siteName, locale: "en_IN" },
};

export const viewport: Viewport = {
  themeColor: "#237d4e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
