import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admin.chosen-international.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'admin.chosen-international.com',
        pathname: '/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1:8000',
        pathname: '/public/**',
      },
      {
        protocol: 'http',
        hostname: 'chosen.test',
        pathname: '/public/**',
      },
    ],
  },
};

export default nextConfig;
