"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string; type: "success" | "error" | "info" };

export function toast(message: string, type: Toast["type"] = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("db-toast", { detail: { message, type } }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
    };
    window.addEventListener("db-toast", handler);
    return () => window.removeEventListener("db-toast", handler);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-card ${
            t.type === "success" ? "bg-brand-700" : t.type === "error" ? "bg-red-600" : "bg-gray-800"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
