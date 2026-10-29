"use client";

import { useState } from "react";

export function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (!images.length) {
    return <div className="grid aspect-square place-items-center rounded-2xl bg-brand-50 text-7xl">🧀</div>;
  }
  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={name} className="aspect-square w-full object-contain" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {images.map((src, idx) => (
            <button key={src + idx} onClick={() => setI(idx)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 ${idx === i ? "ring-brand-600" : "ring-transparent"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
