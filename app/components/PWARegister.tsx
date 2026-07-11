"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 🛠️ FIX: Casting window as any stops TypeScript from complaining about the serwist property
      const win = window as any;
      
      if (win.serwist !== undefined) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("SW registered successfully on scope:", reg.scope);
          })
          .catch((err) => {
            console.error("SW registration failed:", err);
          });
      }
    }
  }, []);

  return null;
}