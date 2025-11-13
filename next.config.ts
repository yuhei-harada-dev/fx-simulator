import type { NextConfig } from "next";

// ローカル開発用のバックエンドURLを定義
// (docker-compose.yml の ports: "8000:8000" と一致)
const localBackendUrl = 'http://localhost:8000/:path*';

// 本番環境（AWS ALB）のURLを定義
const productionBackendUrl = 'http://fx-simulator-alb-501444866.ap-northeast-1.elb.amazonaws.com/:path*';

// 現在が開発モード(npm run dev)かどうかを判定
const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        // 開発モードならローカルに、そうでなければ本番（AWS）に転送
        destination: isDevelopment ? localBackendUrl : productionBackendUrl,
      },
    ];
  },
  /* config options here */
};

export default nextConfig;