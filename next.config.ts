import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/siwe",
  reactStrictMode: true,
  output: "standalone",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
