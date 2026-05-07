import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/guide',
        destination: '/intro',
      },
    ];
  },
};

export default nextConfig;
