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
    ],
  },
};

export default nextConfig;
