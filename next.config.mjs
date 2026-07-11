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
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. SILENCES THE CRITICAL TURBOPACK CRASH
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      }
    ],
  },

  // 2. CORRECT NEXT.JS 16 OPT-OUT SYNTAX INSIDE PROD BUILDS
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Note: Top-level eslint key is removed here to satisfy Next.js 16 rules.
  // To ignore ESLint on build now, run your builds using: NEXT_LINT_IGNORE=true npm run build
};

export default withPWA(nextConfig);