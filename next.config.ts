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
};

export default nextConfig;
