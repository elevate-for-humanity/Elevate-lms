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

      // Canonicalize historical barber/beauty public URLs in one hop.
      { source: '/barber-apprenticeship', destination: '/programs/barber-apprenticeship', permanent: true },
      { source: '/beauty-apprenticeships', destination: '/barber-and-beauty-apprenticeships', permanent: true },
      { source: '/barber-and-beauty-apprenticeship', destination: '/barber-and-beauty-apprenticeships', permanent: true },
      // The former IPLA signup page had hard-coded 2025 dates and referenced a
      // checkout API that never existed. Route candidates to the maintained
      // testing center instead of exposing a broken payment flow.
      { source: '/apprenticeships/ipla-exam', destination: '/testing', permanent: true },

      // Retire the old per-trade apprenticeship dashboards. The LMS /apprentice
      // route is the only operational apprenticeship dashboard.
      { source: '/portal/barber', destination: 'https://app.elevateforhumanity.org/apprentice?program=barber-apprenticeship', permanent: true },
      { source: '/portal/cosmetology', destination: 'https://app.elevateforhumanity.org/apprentice?program=cosmetology-apprenticeship', permanent: true },
      { source: '/portal/esthetician', destination: 'https://app.elevateforhumanity.org/apprentice?program=esthetician-apprenticeship', permanent: true },
      { source: '/portal/nail-technician', destination: 'https://app.elevateforhumanity.org/apprentice?program=nail-technician-apprenticeship', permanent: true },
      { source: '/portal/culinary', destination: 'https://app.elevateforhumanity.org/apprentice?program=culinary-apprenticeship', permanent: true },
      { source: '/portal/electrical', destination: 'https://app.elevateforhumanity.org/apprentice?program=electrical', permanent: true },
      { source: '/portal/plumbing', destination: 'https://app.elevateforhumanity.org/apprentice?program=plumbing', permanent: true },

      // Historical cross-service paths remain as one-hop permanent redirects.
      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/dashboard', permanent: true },
      { source: '/admin/:path*', destination: 'https://admin.elevateforhumanity.org/:path*', permanent: true },
      { source: '/lms/:path*', destination: 'https://app.elevateforhumanity.org/lms/:path*', permanent: true },
      { source: '/employer/:path*', destination: 'https://app.elevateforhumanity.org/employer/:path*', permanent: true },
      { source: '/apprentice', destination: 'https://app.elevateforhumanity.org/apprentice', permanent: true },
      { source: '/apprentice/:path*', destination: 'https://app.elevateforhumanity.org/apprentice/:path*', permanent: true },
      { source: '/parent-portal/:path*', destination: 'https://app.elevateforhumanity.org/parent-portal/:path*', permanent: true },
      { source: '/workforce/:path*', destination: 'https://app.elevateforhumanity.org/workforce/:path*', permanent: true },
      { source: '/cosmetology-host-shop/:path*', destination: 'https://app.elevateforhumanity.org/host-shop/dashboard', permanent: true },
      { source: '/partner/:path*', destination: 'https://app.elevateforhumanity.org/host-shop/dashboard', permanent: true },
      { source: '/host-shop', destination: 'https://app.elevateforhumanity.org/host-shop/dashboard', permanent: true },
      { source: '/host-shop/:path*', destination: 'https://app.elevateforhumanity.org/host-shop/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
