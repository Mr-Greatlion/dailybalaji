import { MessageCircle } from "lucide-react";

export function WhatsAppFab({ phone }: { phone?: string }) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  return (
    <a
      href={`https://wa.me/91${digits.slice(-10)}?text=${encodeURIComponent("Hi, I want to order from Daily Balaji")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-20 right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-card transition hover:scale-105 lg:bottom-6"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
