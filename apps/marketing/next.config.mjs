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
      // Admin is a standalone service at admin.elevateforhumanity.org.
      // Strip the historical /admin prefix when crossing to that container.
      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/dashboard', permanent: false },
      { source: '/admin/:path*', destination: 'https://admin.elevateforhumanity.org/:path*', permanent: false },
      { source: '/lms/:path*', destination: 'https://app.elevateforhumanity.org/lms/:path*', permanent: false },
      { source: '/employer/:path*', destination: 'https://app.elevateforhumanity.org/employer/:path*', permanent: false },
      { source: '/apprentice/:path*', destination: 'https://app.elevateforhumanity.org/apprentice/:path*', permanent: false },
      { source: '/parent-portal/:path*', destination: 'https://app.elevateforhumanity.org/parent-portal/:path*', permanent: false },
      { source: '/workforce/:path*', destination: 'https://app.elevateforhumanity.org/workforce/:path*', permanent: false },
      { source: '/cosmetology-host-shop/:path*', destination: 'https://app.elevateforhumanity.org/cosmetology-host-shop/:path*', permanent: false },
      { source: '/host-shop/:path*', destination: 'https://app.elevateforhumanity.org/host-shop/:path*', permanent: false },
    ];
  },
};

export default nextConfig;
