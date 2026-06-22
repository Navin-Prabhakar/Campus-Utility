import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "./providers";
import { Analytics } from "@vercel/analytics/next";
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
      className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-[#050505] antialiased`}
    >
      {/* 🛠️ FIX: Changed h-screen/overflow-hidden to min-h-screen to allow native window scrolling */}
      <body className="min-h-screen w-full bg-[#050505] text-zinc-300">
        <AuthSessionProvider>
          
          {/* Header handles its own 'fixed' positioning and translation states */}
          <Header />

          {/* 📜 DYNAMIC ACTIVE VIEW CONTENT */}
          {/* 🛠️ FIX: Added padding top (pt-20) for the double header and padding bottom (pb-16) for BottomTabs so content isn't cut off */}
          <main className="w-full pt-20 pb-16 min-h-screen">
            {children}
          </main>

          {/* Bottom tabs handles its own tracking elements */}
          <BottomTabs />

        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}