"use client";

import React from "react";
import Link from "next/link"; 
import { usePathname } from "next/navigation"; // 🟢 Added to track active page accurately

export default function BottomTabs() {
  const pathname = usePathname(); // 🟢 Get current URL path

  // 🟢 NEW: Unified click handler for placeholders
  const handleVacationAlert = () => {
    alert("It will be available after summer vacation.");
  };

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-zinc-200 px-2 py-1 shadow-inner z-50">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
        {Array.from({ length: 5 }).map((_, index) => {
          // 🟢 Determine active state directly from URL route instead of local state
          const isActive = 
            (index === 0 && pathname === "/bus") ||
            (index === 1 && pathname === "/store") ||
            (index === 2 && pathname === "/mess");

          const base =
            "flex-1 rounded-2xl border border-zinc-300 p-1 text-center text-sm font-medium text-zinc-700 shadow-sm cursor-pointer flex items-center justify-center transition transform active:scale-95";
          
          // 🟢 Tweaked text color to keep labels readable when background changes blue
          const activeClass = "bg-blue-300 text-white ring-1 ring-blue-400 [&_span]:text-white";

          const src =
            index === 0 ? "/bus.png" : index === 1 ? "/store.png" : index === 2 ? "/food.png" : index === 4 ? "/schedule.png" : index === 3 ? "/cab.png" : `/tab${index + 1}.svg`;
          const alt = index === 0 ? "Bus" : index === 1 ? "Store" : index === 2 ? "Mess_Menu" : index === 3 ? "Cab" : index === 4 ? "Schedule" : `Tab ${index + 1}`;

          // Content inside buttons
          const tabContent = (
            <div className="flex flex-col items-center justify-center gap-0.5">
              <img
                src={src}
                alt={alt}
                className="h-7 w-7 object-contain" 
              />
              <span className="text-[10px] font-bold tracking-tight text-zinc-600 transition-colors">
                {alt === "Mess_Menu" ? "Mess" : alt}
              </span>
            </div>
          );

          // 🚌 BUS LINK ROUTING (index === 0)
          if (index === 0) {
            return (
              <Link
                key={index}
                href="/bus"
                className={`${base} ${isActive ? activeClass : "bg-white/80"}`}
                aria-pressed={isActive}
                aria-label={alt}
              >
                {tabContent}
              </Link>
            );
          }

          // 🛍️ STORE LINK ROUTING (index === 1)
          if (index === 1) {
            return (
              <Link
                key={index}
                href="/store"
                className={`${base} ${isActive ? activeClass : "bg-white/80"}`}
                aria-pressed={isActive}
                aria-label={alt}
              >
                {tabContent}
              </Link>
            );
          }
          
          // 🍴 MESS MENU LINK ROUTING (index === 2)
          if (index === 2) {
            return (
              <Link
                key={index}
                href="/mess"
                className={`${base} ${isActive ? activeClass : "bg-white/80"}`}
                aria-pressed={isActive}
                aria-label={alt}
              >
                {tabContent}
              </Link>
            );
          }

          // 🗓️ SCHEDULE VACATION DISPATCH (index === 4)
          if (index === 4) {
            return (
              <Link
                key={index}
                href="/schedule"
                className={`${base} ${isActive ? activeClass : "bg-white/80"}`}
                aria-pressed={isActive}
                aria-label={alt}
              >
                {tabContent}
              </Link>
            );
          }
          

          // Remaining placeholder fields (Cab - index === 3)
          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => alert("Cab sharing logs coming soon!")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") alert("Cab sharing logs coming soon!");
              }}
              className={`${base} bg-white/80`}
              aria-pressed={false}
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