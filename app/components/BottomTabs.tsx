"use client";

import React from "react";
import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import { useSession } from "next-auth/react"; // 🛠️ Added session import

export default function BottomTabs() {
  const pathname = usePathname(); 
  const { data: session, status } = useSession(); // 🛠️ Fetch authentication status

  // Completely hide the navigation bar if on the signin page OR if no user session is present
  if (pathname === "/signin" || status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <footer className="fixed bottom-0 left-0 w-full px-4 pb-4 pt-4 bg-gradient-to-t from-[#050608] via-[#0A0B10]/95 to-transparent z-50 pointer-events-none">
      {/* 🚀 FIXED ALIGNMENT: Converted wrapper container to a strict 5-column grid layout grid-cols-5 */}
      <div className="mx-auto grid grid-cols-5 w-full max-w-md items-center bg-[#121424]/90 backdrop-blur-2xl border border-indigo-500/30 p-1.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(99,102,241,0.15)] pointer-events-auto">
        {Array.from({ length: 5 }).map((_, index) => {
          const isActive = 
            (index === 0 && pathname === "/bus") ||
            (index === 1 && pathname === "/store") ||
            (index === 2 && pathname === "/mess") ||
            (index === 3 && pathname === "/cab") ||
            (index === 4 && pathname === "/schedule");

          // 🛠️ FIXED WIDTH: Removed flex-1 to rely on full grid cell expansion
          const base =
            "w-full rounded-xl p-1.5 text-center text-sm font-medium transition-all duration-300 cursor-pointer flex items-center justify-center transform active:scale-90 select-none";
          
          // Unaltered Original Colors
          const activeClass = "bg-gradient-to-b from-[#2A2E54] to-[#1B1D36] text-white border border-indigo-400/50 shadow-[0_4px_14px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] [&_span]:text-indigo-300 [&_img]:scale-105 [&_img]:brightness-125";
          const inactiveClass = "bg-[#181A2D]/50 border border-indigo-950/20 text-slate-400 hover:text-slate-200 hover:bg-[#1E213A]/50 [&_span]:text-slate-400/80";

          const src =
            index === 0 ? "/bus.png" : index === 1 ? "/store.png" : index === 2 ? "/food.png" : index === 4 ? "/schedule.png" : index === 3 ? "/cab.png" : `/tab${index + 1}.svg`;
          const alt = index === 0 ? "Bus" : index === 1 ? "Store" : index === 2 ? "Mess_Menu" : index === 3 ? "Cab" : index === 4 ? "Schedule" : `Tab ${index + 1}`;

          const tabContent = (
            <div className="flex flex-col items-center justify-center gap-1 transition-transform duration-200">
              <img
                src={src}
                alt={alt}
                className="h-6 w-6 object-contain transition-all duration-300 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" 
              />
              <span className="text-[10px] font-black tracking-widest uppercase transition-colors duration-300">
                {alt === "Mess_Menu" ? "Mess" : alt}
              </span>
            </div>
          );

          // 🚌 BUS LINK ROUTING (index === 0)
          if (index === 0) {
            return (
              <Link
                key="tab-bus"
                href="/bus"
                className={`${base} ${isActive ? activeClass : inactiveClass}`}
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
                key="tab-store"
                href="/store"
                className={`${base} ${isActive ? activeClass : inactiveClass}`}
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
                key="tab-mess"
                href="/mess"
                className={`${base} ${isActive ? activeClass : inactiveClass}`}
                aria-pressed={isActive}
                aria-label={alt}
              >
                {tabContent}
              </Link>
            );
          }

          // 🚖 CAB ROUTING (index === 3)
          if (index === 3) {
            return (
              <Link
                key="tab-cab"
                href="/cab"
                className={`${base} ${isActive ? activeClass : inactiveClass}`}
                aria-pressed={isActive}
                aria-label={alt}
              >
                {tabContent}
              </Link>
            );
          }

          // 🗓️ SCHEDULE LINK ROUTING (index === 4)
          if (index === 4) {
            return (
              <Link
                key="tab-schedule"
                href="/schedule"
                className={`${base} ${isActive ? activeClass : inactiveClass}`}
                aria-pressed={isActive}
                aria-label={alt}
              >
                {tabContent}
              </Link>
            );
          }

          return null;
        })}
      </div>
    </footer>
  );
}