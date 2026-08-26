import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { legacyImageRewrites } from '../../lib/media/legacy-image-aliases.mjs';
import { verifiedImageRewrites } from '../../lib/media/verified-image-aliases.mjs';
import { resolveCommitSha } from '../../scripts/build-identity.mjs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  poweredByHeader: false,
  reactStrictMode: true,

  generateBuildId: async () => {
    const sha = resolveCommitSha(process.env);
    return sha === 'local-development' ? 'local-dev' : sha.slice(0, 7);
  },

  env: {
    NEXT_PUBLIC_GIT_SHA: resolveCommitSha(process.env),
    NEXT_PUBLIC_BUILD_ID: `elevate-${resolveCommitSha(process.env)}`,
    NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP ?? 'unknown',
  },

  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  staticPageGenerationTimeout: 300,
  skipTrailingSlashRedirect: true,
  transpilePackages: ['buffer', 'process'],

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/videos/beauty-barber.mp4',
          destination: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/barber-hero-final.mp4',
        },
        ...legacyImageRewrites(),
        ...verifiedImageRewrites(),
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'elevateforhumanity.org' }],
        destination: 'https://www.elevateforhumanity.org/:path*',
        permanent: true,
      },

      // Public compatibility aliases live here so internal application code
      // can point directly at one canonical implementation. Next preserves
      // incoming query parameters for these redirects when the destination
      // does not replace them.
      { source: '/apply/status', destination: '/apply/track', permanent: true },
      { source: '/course-factory', destination: '/ai/course-factory', permanent: true },
      { source: '/compare', destination: '/store#marketplace', permanent: true },
      { source: '/store/white-label', destination: '/white-label', permanent: true },
      { source: '/wioa-training', destination: '/wioa-eligibility', permanent: false },
      { source: '/wioa-funded-training', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/wioa', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/wioa-funding', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/construction', destination: '/programs/skilled-trades', permanent: false },
      { source: '/programs/drug-test', destination: '/programs/drug-collector', permanent: false },
      { source: '/programs/hvac-technician/apply', destination: '/apply/student?program=hvac-technician', permanent: true },
      { source: '/governance/security', destination: '/legal/disclosures', permanent: false },
      { source: '/legal/agreements', destination: '/legal', permanent: false },
      { source: '/intake', destination: '/apply', permanent: false },
      { source: '/snap', destination: '/snap/snap-et', permanent: false },
      { source: '/barber-apprenticeship', destination: '/programs/barber-apprenticeship', permanent: true },
      { source: '/beauty-apprenticeships', destination: '/barber-and-beauty-apprenticeships', permanent: true },
      { source: '/barber-and-beauty-apprenticeship', destination: '/barber-and-beauty-apprenticeships', permanent: true },
      { source: '/apprenticeships/ipla-exam', destination: '/testing', permanent: true },
      { source: '/partners/barber-host-shop', destination: '/partners/host-shops', permanent: true },
      { source: '/partners/barber-host-shop/apply', destination: '/partners/host-shop/apply', permanent: true },
      { source: '/student-portal', destination: '/platform/student-portal', permanent: true },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@supabase/supabase-js'],
    optimizeCss: false,
    scrollRestoration: false,
    workerThreads: false,
    cpus: 1,
  },

  webpack: (config, { isServer }) => {
    config.parallelism = 1;

    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        buffer: false,
        process: false,
      };

      const { ProvidePlugin } = require('webpack');
      config.plugins.push(
        new ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          buffer: ['buffer'],
        }),
      );

      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
