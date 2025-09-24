/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle Pyodide completely on client side only
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "node:child_process": false,
        "node:crypto": false,
        "node:fs": false,
        "node:fs/promises": false,
        "node:path": false,
        "node:url": false,
        "node:util": false,
        "child_process": false,
        "crypto": false,
        "fs": false,
        "path": false,
        "url": false,
        "util": false,
      };
    }

    // Handle Pyodide's webpack warnings and Node.js imports
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/pyodide/,
        message: /Critical dependency/,
      },
      {
        message: /UnhandledSchemeError.*node:/,
      },
    ];

    // Add rules to handle Node.js built-in modules with null-loader
    config.module.rules.push({
      test: /^node:/,
      use: 'null-loader',
    });

    return config;
  },
}

export default nextConfig
