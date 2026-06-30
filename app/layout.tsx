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
  const headerList = await headers();
  const activePath = headerList.get("x-url") || ""; 
  const isSignInPage = activePath.endsWith("/signin");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-[#050505] antialiased`}
    >
      {/* 🛠️ THE FIX: Added 'relative' and removed any strict constraints so global modals can render flawlessly */}
      <body className="min-h-screen w-full bg-[#050505] text-zinc-300 relative">
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
            width: 1px; /* 👈 Set this to exactly how thick you want it (e.g., 6px, 8px, 10px) */
            height: 6px; /* Thickness for horizontal scrolling if any */
          }
          
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #0b6313;
            border-radius: 20px;
            border: 2px solid #0e0505; /* Seamless padding match against your bg-[#050505] background */
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