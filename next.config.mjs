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
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js modules completely on client side
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
        "node:os": false,
        "node:stream": false,
        "node:buffer": false,
        "child_process": false,
        "crypto": false,
        "fs": false,
        "path": false,
        "url": false,
        "util": false,
        "os": false,
        "stream": false,
        "buffer": false,
        "assert": false,
        "events": false,
        "querystring": false,
        "zlib": false,
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
      {
        message: /Can't resolve 'node:/,
      },
      {
        message: /Module not found.*node:/,
      },
    ];

    // Add rules to handle Node.js built-in modules with null-loader
    config.module.rules.push(
      {
        test: /^node:/,
        use: 'null-loader',
      },
      {
        test: /node_modules.*\.(mjs|js)$/,
        resolve: {
          fullySpecified: false,
        },
      }
    );

    // Exclude problematic modules from being processed
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'node:path': 'commonjs node:path',
        'node:fs': 'commonjs node:fs',
        'node:url': 'commonjs node:url',
        'node:crypto': 'commonjs node:crypto',
        'node:util': 'commonjs node:util',
      });
    }

    return config;
  },
}

export default nextConfig
