import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "open.api.nexon.com",
        pathname: "/static/fconline/**",
      },
      {
        protocol: "https",
        hostname: "fconline.nexon.com",
      },
    ],
  },
};

export default nextConfig;
