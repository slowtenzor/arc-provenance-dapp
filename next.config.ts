import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from inferring the monorepo/workspace root incorrectly
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
