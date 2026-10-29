"use client";

import { useRef, useState } from "react";
import { Upload, X, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/Toaster";

export function ImageUploader({ images, onChange, max = 6 }: { images: string[]; onChange: (v: string[]) => void; max?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const next = [...images];
    for (const f of Array.from(files).slice(0, max - images.length)) {
      const fd = new FormData();
      fd.append("file", f);
      try {
        const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Upload failed");
        next.push(d.url);
      } catch (e: any) {
        toast(e.message, "error");
      }
    }
    onChange(next);
    setBusy(false);
    if (ref.current) ref.current.value = "";
  }

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const n = [...images];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={src + i} className="relative h-24 w-24 overflow-hidden rounded-xl ring-1 ring-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-600 px-1 text-[10px] font-bold text-white">MAIN</span>}
            <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"><X className="h-3 w-3" /></button>
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/40 px-1">
              <button type="button" onClick={() => move(i, -1)} className="text-white"><ArrowLeft className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => move(i, 1)} className="text-white"><ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {images.length < max && (
          <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-brand-500 hover:text-brand-700">
            <div className="text-center"><Upload className="mx-auto h-5 w-5" /><span className="text-[11px]">{busy ? "Uploading…" : "Add photo"}</span></div>
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
    </div>
  );
}
