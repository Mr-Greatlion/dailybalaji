import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";

export async function StoreShell({ children }: { children: React.ReactNode }) {
  const [settings, categories, session] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { name: true, slug: true } }),
    getSession(),
  ]);
  return (
    <div className="flex min-h-screen flex-col">
      <Header
        siteName={settings.company_name}
        announcement={settings.announcement}
        phone={settings.company_phone}
        categories={categories}
        user={session ? { name: session.name, role: session.role } : null}
      />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer s={settings} />
      <WhatsAppFab phone={settings.company_whatsapp || settings.company_phone} />
    </div>
  );
}
