import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true, 
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swMinify: true,
  disable: process.env.NODE_ENV === "development",
  scope: "/",
  startUrl: "/",

  // 🛠️ FIX: Forces the service worker to cache pages and raw CSV streams for absolute offline autonomy
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/docs\.google\.com\/spreadsheets.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-sheets-data',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 24 * 60 * 60 // Keeps the sheet records stored alive for 24 Hours
          }
        }
      },
      {
        urlPattern: /\/$/, // Caches the root page wrapper framework shell
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
  turbopack: {},

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