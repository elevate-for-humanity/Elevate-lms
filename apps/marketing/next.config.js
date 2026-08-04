import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { resolveCommitSha } from '../../scripts/build-identity.mjs';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  outputFileTracingRoot: path.join(__dirname, '../..'),

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

  async redirects() {
    return [
      { source: '/wioa-training', destination: '/wioa-eligibility', permanent: false },
      { source: '/wioa-funded-training', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/wioa', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/wioa-funding', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/construction', destination: '/programs/skilled-trades', permanent: false },
      { source: '/programs/drug-test', destination: '/programs/drug-collector', permanent: false },
      { source: '/governance/security', destination: '/legal/disclosures', permanent: false },
      { source: '/legal/agreements', destination: '/legal', permanent: false },
      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/dashboard', permanent: false },
      { source: '/student-portal/education', destination: '/learner/dashboard', permanent: false },
      { source: '/intake', destination: '/apply', permanent: false },
      { source: '/snap', destination: '/snap/snap-et', permanent: false },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@supabase/supabase-js'],
    optimizeCss: false,
    scrollRestoration: false,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      /*
       * Browser-compatible replacements for dependencies that expect
       * Node's Buffer or process globals.
       */
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
      };

      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        buffer: require.resolve('buffer/'),
        'process/browser': require.resolve('process/browser'),
      };

      /*
       * Inject Buffer and process only where a browser module
       * references those globals.
       */
      const { ProvidePlugin } = require('webpack');
      config.plugins.push(
        new ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: ['process/browser'],
        }),
      );

      /*
       * Do not externalize buffer, process, crypto, stream, or other
       * modules needed by browser-compatible packages.
       */
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
