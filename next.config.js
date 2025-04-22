/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // External packages that can be used by server components
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Add transpilePackages for Clerk if needed
  transpilePackages: ['@clerk/nextjs'],
  // Ensure API endpoints are always processed as Server-Side
  eslint: {
    // Ignore ESLint during builds for faster development
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 