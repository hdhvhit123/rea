import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: __dirname },
  serverExternalPackages: ["qrcode"],
};

export default nextConfig;
