import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import("next").NextConfig} */

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(currentDirectory, "../.."),
  poweredByHeader: false,
  reactStrictMode: true,

  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  webpack(config) {
    config.parallelism = 1;
    return config;
  },

  env: {
    GIT_SHA:
      process.env.GIT_SHA ??
      process.env.GITHUB_SHA ??
      "unknown",

    NEXT_PUBLIC_GIT_SHA:
      process.env.NEXT_PUBLIC_GIT_SHA ??
      process.env.GIT_SHA ??
      process.env.GITHUB_SHA ??
      "unknown",

    BUILD_TIMESTAMP:
      process.env.BUILD_TIMESTAMP ??
      new Date().toISOString(),
  },

  async redirects() {
    return [
      // Canonical public hostname. Keep all indexable Marketing URLs on www.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'elevateforhumanity.org' }],
        destination: 'https://www.elevateforhumanity.org/:path*',
        permanent: true,
      },

      // Historical cross-service paths remain as one-hop permanent redirects.
      // Internal navigation should point directly to the destination hosts.
      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/dashboard', permanent: true },
      { source: '/admin/:path*', destination: 'https://admin.elevateforhumanity.org/:path*', permanent: true },
      { source: '/lms/:path*', destination: 'https://app.elevateforhumanity.org/lms/:path*', permanent: true },
      { source: '/employer/:path*', destination: 'https://app.elevateforhumanity.org/employer/:path*', permanent: true },
      { source: '/apprentice/:path*', destination: 'https://app.elevateforhumanity.org/apprentice/:path*', permanent: true },
      { source: '/parent-portal/:path*', destination: 'https://app.elevateforhumanity.org/parent-portal/:path*', permanent: true },
      { source: '/workforce/:path*', destination: 'https://app.elevateforhumanity.org/workforce/:path*', permanent: true },
      { source: '/cosmetology-host-shop/:path*', destination: 'https://app.elevateforhumanity.org/cosmetology-host-shop/:path*', permanent: true },
      { source: '/host-shop/:path*', destination: 'https://app.elevateforhumanity.org/host-shop/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
