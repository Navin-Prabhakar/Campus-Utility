import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  sw: "sw.js", 
  cacheOnFrontEndNav: true, 
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swMinify: true,
  
  // 🛠️ THE ABSOLUTE KILL SWITCH FIX: Development environment me PWA disabled rahega loop se bachne ke liye,
  // aur final build / Vercel production deployment me automatically absolute TRUE (offline network active) ho jayega.
  disable: process.env.NODE_ENV === "development", 
  
  scope: "/",
  startUrl: "/",

  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/docs\.google\.com\/spreadsheets.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-sheets-data',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 24 * 60 * 60 
          }
        }
      },
      // 🛠️ FIX 1: DYNAMIC APP SHELLS CACHING ENGINE
      // Yeh block bina internet ke bhi /mess, /store, aur /schedule ke HTML/JS chunks ko freeze karke safe rakhega, 
      // jisse offline hone par black cloud screen bypass ho jayegi.
      {
        urlPattern: /\/(mess|store|schedule)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'protected-app-pages-shell',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 7 Din ka absolute fallback freeze window
          }
        }
      },
      {
        urlPattern: /\/$/, 
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'root-landing-shell'
        }
      }
    ]
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ducanh2912/next-pwa"],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      }
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPWA(nextConfig);