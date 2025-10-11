import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        //destination: 'http://localhost:8000/api/:path*',
        destination: 'https://smart-investor-backend-8xjt.onrender.com/api/:path*',
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,  // ✅ 배포 중 ESLint 오류 무시
  }
};

export default nextConfig;
