"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import { useSession } from "next-auth/react"; 

const tabGradients = [
  "from-sky-400 to-purple-700",  
  "from-emerald-400 to-indigo-700",   
  "from-purple-500 to-indigo-800",     
  "from-emerald-400 to-indigo-700",     
  "from-sky-400 to-purple-700", 
];

export default function BottomTabs() {
  const pathname = usePathname(); 
  const { data: session, status } = useSession(); 

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScrollVector = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const totalDocumentHeight = document.documentElement.scrollHeight;

      if (currentScrollY < 0) return;

      const isAtAbsoluteBottom = (currentScrollY + windowHeight) >= (totalDocumentHeight - 3);

      if (isAtAbsoluteBottom) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      const maxScrollableHeight = totalDocumentHeight - windowHeight;
      if (currentScrollY > maxScrollableHeight) return;

      if (Math.abs(currentScrollY - lastScrollY) < 10) return;

      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false); 
      } else {
        setIsVisible(true);  
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScrollVector, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollVector);
  }, [lastScrollY]);

  // 🛠️ FIX: OFFLINE AUTHENTICATION SAFE GUARD RAIL
  // Agar status loading hai aur user offline hai, toh tabs ko forcefully render hone do!
  const isOffline = typeof window !== "undefined" && !navigator.onLine;
  const shouldBlockTabs = pathname === "/signin" || (status === "unauthenticated" && !isOffline) || (!session && status !== "loading");

  if (shouldBlockTabs) {
    return null;
  }

  return (
    <footer className={`fixed bottom-0 left-0 w-full px-0 pb-0 pt-8 bg-gradient-to-t from-[#050608] via-[#0A0B12]/95 to-transparent z-50 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${
      isVisible ? "translate-y-0" : "translate-y-full"
    }`}>
      <div className="mx-auto grid grid-cols-5 w-full max-w-md items-center bg-slate-950 backdrop-blur-3xl border border-slate-900 p-0 rounded-xl shadow-[0_12px_40px_rgba(5,4,6,0.7),0_0_30px_rgba(90,102,241,0.15)] pointer-events-auto">
        {Array.from({ length: 5 }).map((_, index) => {
          const isActive = 
            (index === 0 && pathname === "/bus") ||
            (index === 1 && pathname === "/store") ||
            (index === 2 && pathname === "/mess") ||
            (index === 3 && pathname === "/cab") ||
            (index === 4 && pathname === "/schedule");

          const base =
            "w-full p-1 text-center text-sm font-medium transition-all duration-300 cursor-pointer flex items-center justify-center transform active:scale-95 select-none group";
          
          const activeClass = "text-white";
          const inactiveClass = "text-slate-400 hover:text-slate-100";

          const src =
            index === 0 ? "/bus.png" : index === 1 ? "/store.png" : index === 2 ? "/food.png" : index === 4 ? "/schedule.png" : index === 3 ? "/cab.png" : `/tab${index + 1}.svg`;
          const alt = index === 0 ? "Bus" : index === 1 ? "Store" : index === 2 ? "Mess_Menu" : index === 3 ? "Cab" : index === 4 ? "Schedule" : `Tab ${index + 1}`;

          const iconBoxClass = isActive
            ? `bg-gradient-to-b ${tabGradients[index]} border border-indigo-500/80 shadow-[0_4px_14px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] scale-105 brightness-125 p-2 rounded-2xl`
            : "";
            
          const tabContent = (
            <div className="flex flex-col items-center justify-center gap-1 transition-transform duration-100 w-full">
              <div className={iconBoxClass}>
                <img
                  src={src}
                  alt={alt}
                  className="h-7 w-9 object-contain transition-all duration-200 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" 
                />
              </div>
              
              <span className={`text-[10px] font-black tracking-widest uppercase transition-colors duration-300 ${isActive ? 'text-neutral-200' : 'text-slate-400/80 group-hover:text-slate-200'}`}>
                {alt === "Mess_Menu" ? "Mess_Menu" : alt}
              </span>
            </div>
          );

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