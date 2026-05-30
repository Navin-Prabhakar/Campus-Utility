/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Same safety mechanism for strict TypeScript check warnings
    ignoreBuildErrors: true,
  }
};

export default nextConfig;