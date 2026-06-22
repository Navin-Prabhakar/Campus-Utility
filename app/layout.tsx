import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "./providers";
import { Analytics } from "@vercel/analytics/next";
// 🛠️ IMPORT GLOBAL VIEW ELEMENTS
import Header from "./components/Header";
import BottomTabs from "./components/BottomTabs";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-[#050505] antialiased`}
    >
      {/* 🛠️ MODIFIED: Fixed viewport height parameters to lock navigation bars firmly into place on mobile phone displays */}
      <body className="h-screen max-h-screen w-full bg-[#050505] flex flex-col overflow-hidden text-zinc-300">
        <AuthSessionProvider>
          
          {/* 📌 FIXED ACCENTS UP HEADER NODE */}
          <div className="shrink-0 z-40">
            <Header />
          </div>

          {/* 📜 DISPATCH DYNAMIC ACTIVE CLIENT SCREENS VIEW */}
          <div className="flex-1 w-full overflow-hidden relative">
            {children}
          </div>

          {/* 📌 FLOATING SYSTEM NAVIGATION DOCK BAR */}
          <div className="shrink-0 z-40">
            <BottomTabs />
          </div>

        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}