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
  // Next.js 16부터 eslint 옵션은 next.config.ts에서 제거됨
  // ESLint 설정은 .eslintrc.json 또는 eslint.config.mjs에서 관리
};

export default nextConfig;
