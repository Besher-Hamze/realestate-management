import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: true,
    domains: ['localhost'],
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;