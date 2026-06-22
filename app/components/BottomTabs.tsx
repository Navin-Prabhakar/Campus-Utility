"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import { useSession } from "next-auth/react"; 

// colour of tabs:
const tabGradients = [
  "from-sky-400 to-purple-700",  // Tab 0 (Bus) -> Fresh Green/Teal
  "from-emerald-400 to-indigo-700",   // Tab 1 (Store) -> Warm Amber/Gold
  "from-purple-500 to-indigo-800",     // Tab 2 (Mess) -> Appetizing Rose/Red
  "from-emerald-400 to-indigo-700",      // Tab 3 (Cab) -> Cool Sky Blue
  "from-sky-400 to-purple-700", // Tab 4 (Schedule) -> Royal Purple/Indigo
];

export default function BottomTabs() {
  const pathname = usePathname(); 
  const { data: session, status } = useSession(); 

  // 📱 NEW: State monitors tracking the window scroll vector for smooth transitions
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScrollVector = () => {
      const currentScrollY = window.scrollY;

      // Safe boundaries for mobile elastic-bouncing tracking layouts (iOS Safari)
      if (currentScrollY < 0) return;
      const maxScrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (currentScrollY > maxScrollableHeight) return;

      // Intentionality threshold: Filter out shaky inputs below 10px
      if (Math.abs(currentScrollY - lastScrollY) < 10) return;

      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false); // Swipe down -> slide away
      } else {
        setIsVisible(true);  // Swipe up -> show tabs
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScrollVector, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollVector);
  }, [lastScrollY]);

  if (pathname === "/signin" || status === "unauthenticated" || !session) {
    return null;
  }

  return (
    // 🛠️ MODIFIED: Injected transition tracking mechanics alongside cubic-bezier acceleration settings
    <footer className={`fixed bottom-0 left-0 w-full px-0 pb-0 pt-8 bg-gradient-to-t from-[#050608] via-[#0A0B12]/95 to-transparent z-50 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${
      isVisible ? "translate-y-0" : "translate-y-full"
    }`}>
      <div className="mx-auto grid grid-cols-5 w-full max-w-md items-center bg-slate-950 backdrop-blur-3xl border border-slate-900 p-0 rounded-1xl shadow-[0_12px_40px_rgba(5,4,6,0.7),0_0_30px_rgba(90,102,241,0.15)] pointer-events-auto">
        {Array.from({ length: 5 }).map((_, index) => {
          const isActive = 
            (index === 0 && pathname === "/bus") ||
            (index === 1 && pathname === "/store") ||
            (index === 2 && pathname === "/mess") ||
            (index === 3 && pathname === "/cab") ||
            (index === 4 && pathname === "/schedule");

          // Base styling for the parent anchor link container
          const base =
            "w-full p-1 text-center text-sm font-medium transition-all duration-300 cursor-pointer flex items-center justify-center transform active:scale-0 select-none group";
          
          // Outer link color states (no boxes here anymore)
          const activeClass = "text-white";
          const inactiveClass = "text-slate-400 hover:text-slate-100";

          const src =
            index === 0 ? "/bus.png" : index === 1 ? "/store.png" : index === 2 ? "/food.png" : index === 4 ? "/schedule.png" : index === 3 ? "/cab.png" : `/tab${index + 1}.svg`;
          const alt = index === 0 ? "Bus" : index === 1 ? "Store" : index === 2 ? "Mess_Menu" : index === 3 ? "Cab" : index === 4 ? "Schedule" : `Tab ${index + 1}`;

          // iconBoxClass :
          const iconBoxClass = isActive
            ? `bg-gradient-to-b ${tabGradients[index]} border border-indigo-500/80 shadow-[0_4px_14px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] scale-105 brightness-125 p-2 rounded-2xl`
            : "";
            
          const tabContent = (
            <div className="flex flex-col items-center justify-center gap-1 transition-transform duration-100 w-full">
              {/* Icon Box Wrapper: Only wraps the .png file */}
              <div className={iconBoxClass}>
                <img
                  src={src}
                  alt={alt}
                  className="h-6 w-9 object-contain transition-all duration-200 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" 
                />
              </div>
              
              {/* Text label rests safely outside the active box layout */}
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