import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  sw: "sw.js", // 🛠️ FORCE PATH: Generator ko clear instruction ki public/sw.js file likhni hai
  cacheOnFrontEndNav: true, 
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swMinify: true,
  disable: false, // 🛠️ LOCAL TESTING: Abhi false rakho taaki localhost par service worker file compile ho sake
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
  // 🛠️ TURBOPACK COMPATIBILITY ENGINE: Next.js 16 compilation pipeline ko optimize karne ke liye
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