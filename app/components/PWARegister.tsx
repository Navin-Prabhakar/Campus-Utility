"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    // 🛠️ FIX: Local dev mode me SW register block karo taaki next dev infinite compilation loop me na phase
    if (process.env.NODE_ENV === "development") {
      console.log("🛠️ Dev mode detected: Bypassing PWA Service Worker registration.");
      return;
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("🔥 BOOM! Service Worker registered successfully on scope:", reg.scope);
        })
        .catch((err) => {
          console.error("❌ SW registration crashed:", err);
        });
    }
  }, []);

  return null;
}