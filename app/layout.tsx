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
  title: "Campus Utility - IIT Patna",
  description: "Unofficial utility application for IITP students",
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
      </body>
    </html>
  );
}