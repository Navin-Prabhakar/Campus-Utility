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
  // 🟢 Server-side URL interception
  const headerList = await headers();
  const activePath = headerList.get("x-url") || ""; 
  const isSignInPage = activePath.endsWith("/signin");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-[#050505] antialiased`}
    >
      <body className="min-h-screen w-full bg-[#050505] text-zinc-300">
        <AuthSessionProvider>
          
          {/* Global Header Layout Element */}
          <Header />

          {/* 📜 DYNAMIC ACTIVE VIEW CONTENT */}
          {/* 🛠️ THE FIX: Dynamically alters padding configuration out of the server compilation frame.
              If the route matches /signin, paddings collapse to 0, ensuring your auth page fills the screen perfectly.
              For all other functional tabs, standard paddings are maintained. */}
          <main className={`w-full min-h-screen transition-all duration-150 ${
            isSignInPage ? "pt-0 pb-0" : "pt-20 pb-16"
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