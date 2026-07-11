"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 🛠️ BYPASS CONDITION: Direct register call block bina kisi extra checking validation ke
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