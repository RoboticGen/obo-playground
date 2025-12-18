import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (empty to silence warning)
  turbopack: {},
  // Enable WebAssembly and experimental features
  experimental: {
    webpackBuildWorker: true,
  },
};

export default nextConfig;
