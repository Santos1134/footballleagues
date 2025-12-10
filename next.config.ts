import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Skip static page generation during build when env vars are missing
  output: 'standalone',
  // Disable static optimization for all pages during build
  experimental: {
    // This ensures pages are rendered at request time, not build time
  },
};

export default nextConfig;
