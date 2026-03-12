import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fco.dn.nexoncdn.co.kr",
        pathname: "/live/externalAssets/**",
      },
    ],
  },
};

export default nextConfig;
