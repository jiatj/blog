import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.10.11"],
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    root: __dirname
  }
};

export default nextConfig;
