"use client";

import React, { useState } from "react";
import Link from "next/link"; // <-- Link import kiya necessary routing ke liye

export default function BottomTabs() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-zinc-200 px-4 py-3 shadow-inner">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
        {Array.from({ length: 5 }).map((_, index) => {
          const isActive = active === index;
          const base =
            "flex-1 rounded-2xl border border-zinc-300 p-1 text-center text-sm font-medium text-zinc-700 shadow-sm cursor-pointer flex items-center justify-center transition transform active:scale-95";
          const activeClass = "bg-blue-300 text-white ring-1 ring-blue-400";

          const src =
            index === 0 ? "/bus.png" : index === 1 ? "/store.png" : index === 2 ? "/food.png" : index === 4 ? "/schedule.png" : index === 3 ? "/cab.png" : `/tab${index + 1}.svg`;
          const alt = index === 0 ? "Bus" : index === 1 ? "Store" : index === 2 ? "Food" : index === 3 ? "Cab" : index === 4 ? "Schedule" : `Tab ${index + 1}`;

          // Content jo button ke andar dikhega (Image icon)
          const tabContent = (
            <img
              src={src}
              alt={alt}
              className="h-10 w-10 object-contain"
            />
          );

          // NECESSARY CHANGE: Agar index === 0 (Bus) hai, toh use Link component bana do
          if (index === 0) {
            return (
              <Link
                key={index}
                href="/bus"
                onClick={() => setActive(index)}
                className={`${base} ${isActive ? activeClass : "bg-white/80"}`}
                aria-pressed={isActive}
                aria-label={alt}
              >
                {tabContent}
              </Link>
            );
          }

          // Baki saare buttons normal pehle ki tarah hi kaam karenge
          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => setActive(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setActive(index);
              }}
              className={`${base} ${isActive ? activeClass : "bg-white/80"}`}
              aria-pressed={isActive}
              aria-label={alt}
            >
              {tabContent}
            </div>
          );
        })}
      </div>
    </footer>
  );
}