// import { withSentryConfig } from '@sentry/nextjs'; // TEMP: disabled until package installs
import fs from 'node:fs';
import path from 'node:path';

const lmsOnlyStandaloneTraceExcludes = [
  'node_modules/sharp/**/*',
  'node_modules/canvas/**/*',
];

const sharedStandaloneTraceExcludes = [
  '**/@types/**/*',
  '**/*.test.*',
  '**/tests/**/*',
  '**/docs/**/*',
];

const useStandaloneOutput = process.env.NEXT_STANDALONE_OUTPUT === '1' || process.env.CI === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable source maps in production builds — saves ~500MB heap during build
  productionSourceMap: false,
  
  // Build stability for OOM issues
  staticPageGenerationTimeout: 1000,
  
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  transpilePackages: ['edge-tts'],
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.northflank.app' },
      { protocol: 'https', hostname: 'www.elevateforhumanity.org' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    workerThreads: false,
    cpus: 2,  // Reduced from 4 to limit memory during builds
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-'],
    modularizeImports: {
      'lucide-react': {
        transform: 'lucide-react/dist/esm/icons/{{member}}',
        skipDefaultConversion: true,
      },
    },
    serverActions: {
      allowedOrigins: [
        'www.elevateforhumanity.org',
        'elevateforhumanity.org',
        'app.elevateforhumanity.org',
        'admin.elevateforhumanity.org',
        '*.elevateforhumanity.org',
        '*.northflank.app',
      ],
    },
  },

  async redirects() {
    return [
      { source: '/admin/completions', destination: '/admin/analytics/learning', permanent: true },
      { source: '/admin/outcomes', destination: '/admin/analytics', permanent: true },
      { source: '/admin/copilot', destination: '/admin/studio', permanent: true },
      { source: '/admin/video-manager', destination: '/admin/studio', permanent: true },
      { source: '/admin/course-builder', destination: '/admin/studio', permanent: true },
      { source: '/studio(.*)', destination: '/admin/studio$1', permanent: false },
      { source: '/admin-dashboard', destination: '/admin/dashboard', permanent: true },
      { source: '/forgotpassword', destination: '/reset-password', permanent: true },
      { source: '/resetpassword', destination: '/reset-password', permanent: true },
      { source: '/verifyemail', destination: '/verify-email', permanent: true },
      { source: '/apprentice/dashboard', destination: '/apprentice', permanent: true },
      { source: '/apprentice/progress', destination: '/apprentice/hours', permanent: true },
    ];
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        bufferutil: 'commonjs bufferutil',
      });
    }

    if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') {
      config.cache = false;
    }

    return config;
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  outputFileTracingExcludes: {
    '*': [...sharedStandaloneTraceExcludes, ...lmsOnlyStandaloneTraceExcludes],
  },

  // Force-include critical server-side files in standalone output
  outputFileTracingIncludes: {
    '/api/**': ['lib/logger.ts'],
    '/admin/**': ['lib/logger.ts', 'lib/memory-monitor.ts'],
  },
};

export default nextConfig;
