import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Para Docker con EasyPanel
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
