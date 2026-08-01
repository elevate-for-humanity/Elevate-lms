import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import webpack from "webpack";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const require = createRequire(import.meta.url);

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(currentDirectory, "../.."),
  poweredByHeader: false,
  reactStrictMode: true,

  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  webpack(config, { isServer }) {
    config.parallelism = 1;

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser"),
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          buffer: "buffer",
          process: "process/browser",
        })
      );
    }

    return config;
  },

  env: {
    GIT_SHA: process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? "unknown",
    NEXT_PUBLIC_GIT_SHA:
      process.env.NEXT_PUBLIC_GIT_SHA ??
      process.env.GIT_SHA ??
      process.env.GITHUB_SHA ??
      "unknown",
    BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP ?? new Date().toISOString(),
  },

  async redirects() {
    return [
      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/admin', permanent: false },
      { source: '/admin/:path*', destination: 'https://admin.elevateforhumanity.org/admin/:path*', permanent: false },
      { source: '/lms/:path*', destination: 'https://app.elevateforhumanity.org/lms/:path*', permanent: false },
      { source: '/employer/:path*', destination: 'https://app.elevateforhumanity.org/employer/:path*', permanent: false },
      { source: '/apprentice/:path*', destination: 'https://app.elevateforhumanity.org/apprentice/:path*', permanent: false },
      { source: '/parent-portal/:path*', destination: 'https://app.elevateforhumanity.org/parent-portal/:path*', permanent: false },
      { source: '/workforce/:path*', destination: 'https://app.elevateforhumanity.org/workforce/:path*', permanent: false },
      { source: '/cosmetology-host-shop/:path*', destination: 'https://app.elevateforhumanity.org/cosmetology-host-shop/:path*', permanent: false },
      { source: '/host-shop/:path*', destination: 'https://app.elevateforhumanity.org/host-shop/:path*', permanent: false },
      { source: '/partner', destination: 'https://app.elevateforhumanity.org/partner/dashboard', permanent: false },
      { source: '/partner/:path*', destination: 'https://app.elevateforhumanity.org/partner/:path*', permanent: false },
    ];
  },
};

export default nextConfig;
