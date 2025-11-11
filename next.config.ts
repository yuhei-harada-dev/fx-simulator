import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Vercel上の /api/proxy/ へのリクエストを...
        source: '/api/proxy/:path*',
        // ...AWS (ALB) の http://... へ転送する
        destination: 'http://fx-simulator-alb-501444866.ap-northeast-1.elb.amazonaws.com/:path*',
      },
    ];
  },
  /* config options here */
};

export default nextConfig;
