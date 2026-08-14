import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { legacyImageRewrites } from '../../lib/media/legacy-image-aliases.mjs';
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
      beforeFiles: legacyImageRewrites(),
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

      { source: '/wioa-training', destination: '/wioa-eligibility', permanent: false },
      { source: '/wioa-funded-training', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/wioa', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/wioa-funding', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/construction', destination: '/programs/skilled-trades', permanent: false },
      { source: '/programs/drug-test', destination: '/programs/drug-collector', permanent: false },
      { source: '/governance/security', destination: '/legal/disclosures', permanent: false },
      { source: '/legal/agreements', destination: '/legal', permanent: false },
      { source: '/intake', destination: '/apply', permanent: false },
      { source: '/snap', destination: '/snap/snap-et', permanent: false },

      { source: '/barber-apprenticeship', destination: '/programs/barber-apprenticeship', permanent: true },
      { source: '/beauty-apprenticeships', destination: '/barber-and-beauty-apprenticeships', permanent: true },
      { source: '/barber-and-beauty-apprenticeship', destination: '/barber-and-beauty-apprenticeships', permanent: true },
      { source: '/apprenticeships/ipla-exam', destination: '/testing', permanent: true },

      { source: '/portal/barber', destination: 'https://app.elevateforhumanity.org/apprentice?program=barber-apprenticeship', permanent: true },
      { source: '/portal/cosmetology', destination: 'https://app.elevateforhumanity.org/apprentice?program=cosmetology-apprenticeship', permanent: true },
      { source: '/portal/esthetician', destination: 'https://app.elevateforhumanity.org/apprentice?program=esthetician-apprenticeship', permanent: true },
      { source: '/portal/nail-technician', destination: 'https://app.elevateforhumanity.org/apprentice?program=nail-technician-apprenticeship', permanent: true },
      { source: '/portal/culinary', destination: 'https://app.elevateforhumanity.org/apprentice?program=culinary-apprenticeship', permanent: true },
      { source: '/portal/electrical', destination: 'https://app.elevateforhumanity.org/apprentice?program=electrical', permanent: true },
      { source: '/portal/plumbing', destination: 'https://app.elevateforhumanity.org/apprentice?program=plumbing', permanent: true },

      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/dashboard', permanent: true },
      { source: '/admin/:path*', destination: 'https://admin.elevateforhumanity.org/:path*', permanent: true },
      { source: '/lms/:path*', destination: 'https://app.elevateforhumanity.org/lms/:path*', permanent: true },
      { source: '/student-portal/education', destination: 'https://app.elevateforhumanity.org/lms/dashboard', permanent: true },
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

      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        buffer: false,
        'process/browser': false,
      };

      const { ProvidePlugin } = require('webpack');
      config.plugins.push(
        new ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          buffer: ['buffer'],
          process: ['process/browser'],
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
