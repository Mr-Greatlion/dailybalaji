"use client";

import Link from "next/link";
import { Printer, ArrowLeft, Share2 } from "lucide-react";

export function PrintBar({ backHref }: { backHref: string }) {
  return (
    <div className="no-print mx-auto mb-4 flex max-w-[800px] items-center justify-between px-2 sm:px-0">
      <Link href={backHref} className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={() => navigator.share?.({ title: document.title, url: location.href }).catch(() => {})}><Share2 className="h-4 w-4" /> Share</button>
        <button className="btn-primary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / Save PDF</button>
      </div>
    </div>
  );
}
