import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import Header from "./components/Header";
import BottomTabs from "./components/BottomTabs";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus_Utility",
  manifest: '/manifest.json', 
  description: "Daily Utility application for students of IIT Patna",
  icons: {
    icon: "/CU-logo1.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🛠️ FIX: Safe offline initialization to prevent server-side header resolution from crashing the app shell
  let isSignInPage = false;
  try {
    const headerList = await headers();
    const activePath = headerList.get("x-url") || ""; 
    isSignInPage = activePath.endsWith("/signin");
  } catch (e) {
    console.log("App architecture running in offline fallback matrix mode safely, bro.");
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-[#050505] antialiased`}
    >
      <body className="min-h-screen w-full bg-[#050505] text-zinc-300 relative font-sans font-black tracking-normal">
        <AuthSessionProvider>
          
          {/* Global Header Element */}
          <Header />

          {/* 📜 DYNAMIC ACTIVE VIEW CONTENT */}
          <main className={`w-full min-h-screen transition-all duration-150 ${
            isSignInPage ? "pt-0 pb-0" : "pt-0 pb-0"
          }`}>
            {children}
          </main>

          {/* Global Floating Footer Navigation Dock */}
          <BottomTabs />

        </AuthSessionProvider>
        <Analytics />

        {/* 🌐 GLOBAL SCROLLBAR ENGINE INJECTED HERE */}
        <style dangerouslySetInnerHTML={{ __html: `
          ::-webkit-scrollbar {
            width: 1px;
            height: 6px; 
          }
          
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #0b6313;
            border-radius: 20px;
            border: 2px solid #0e0505; 
            background-clip: padding-box;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #15a329;
          }
        `}} />
      </body>
    </html>
  );
}