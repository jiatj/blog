import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.10.11"],
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "tiejunjia.com" }], destination: "https://www.tiejunjia.com/:path*", permanent: true }];
  },
  async rewrites() {
    return {
      // Production public-file discovery happens at startup. Serve later uploads on demand.
      fallback: [
        { source: "/posts/:asset+", destination: "/api/content-assets/posts/:asset+" },
        { source: "/tools/:asset+", destination: "/api/content-assets/tools/:asset+" }
      ]
    };
  },
  turbopack: {
    root: __dirname
  }
};

export default nextConfig;
