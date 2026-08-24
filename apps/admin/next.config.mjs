/**
 * apps/admin/next.config.mjs
 * Standalone Next.js app for admin/instructor/staff/internal APIs.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { sharedStandaloneTraceExcludes } from '../../scripts/next-standalone-trace-excludes.mjs';
import { resolveCommitSha } from '../../scripts/build-identity.mjs';
import { legacyImageRewrites } from '../../lib/media/legacy-image-aliases.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const useStandaloneOutput =
  process.env.GITHUB_ACTIONS !== 'true' || process.env.NEXT_STANDALONE_OUTPUT === '1';

/** @type {import('next').NextConfig} */
const adminConfig = {
  ...(useStandaloneOutput ? { output: 'standalone' } : {}),

  generateBuildId: async () => {
    const sha = resolveCommitSha(process.env);
    return sha === 'local-development' ? 'admin-local-dev' : `admin-${sha}`;
  },

  env: {
    NEXT_PUBLIC_GIT_SHA: resolveCommitSha(process.env),
    NEXT_PUBLIC_BUILD_ID: `admin-${resolveCommitSha(process.env)}`,
    NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP ?? 'unknown',
  },

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  experimental: {
    workerThreads: false,
    cpus: 1,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
  },

  transpilePackages: ['edge-tts'],

  webpack(config, { isServer, nextRuntime }) {
    config.resolve.alias['@'] = ROOT;

    config.resolve.alias[
      'next/dist/server/route-modules/app-page/vendored/contexts/loadable'
    ] = 'next/dist/shared/lib/loadable-context.shared-runtime.js';

    if (nextRuntime === 'edge') {
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
        'fs/promises': false,
        path: false,
        os: false,
        child_process: false,
      };
    }

    if (isServer) {
      config.resolve.alias['@/lib/logger'] = path.join(ROOT, 'lib/logger.ts');
      config.resolve.alias['@/lib/supabase'] = path.join(ROOT, 'lib/supabase');
    }
    config.parallelism = 1;
    if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') config.cache = false;

    config.optimization = config.optimization || {};
    config.optimization.minimize = false;
    config.optimization.minimizer = [];

    return config;
  },

  async headers() {
    return [
      {
        source: '/sw-admin.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest-admin.json',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        source: '/offline.html',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [
        { source: '/admin/applications/:path*', destination: '/applications/:path*' },
        ...legacyImageRewrites(),
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  async redirects() {
    return [
      { source: '/', destination: '/dashboard', permanent: false },
      { source: '/admin/studio/:path*', destination: '/studio/:path*', permanent: true },
      { source: '/admin/dev-studio/:path*', destination: '/studio/:path*', permanent: true },
      { source: '/dev-studio/:path*', destination: '/studio/:path*', permanent: true },
      { source: '/admin/dashboard', destination: '/dashboard', permanent: true },
      { source: '/admin', destination: '/dashboard', permanent: true },
      { source: '/admin/:path*', destination: '/:path*', permanent: true },
      { source: '/apply', destination: 'https://www.elevateforhumanity.org/apply', permanent: false },
      { source: '/eligibility', destination: 'https://www.elevateforhumanity.org/eligibility', permanent: false },
      { source: '/about', destination: 'https://www.elevateforhumanity.org/about', permanent: false },
      { source: '/contact', destination: 'https://www.elevateforhumanity.org/contact', permanent: false },
      { source: '/testing', destination: 'https://www.elevateforhumanity.org/testing', permanent: false },
    ];
  },

  outputFileTracingRoot: ROOT,
  outputFileTracingExcludes: { '*': sharedStandaloneTraceExcludes },
  outputFileTracingIncludes: {
    '/api/**': ['lib/logger.ts'],
    '/studio/**': ['lib/logger.ts'],
  },

  serverExternalPackages: [
    'remotion', '@remotion/bundler', '@remotion/renderer',
    '@remotion/compositor-linux-x64-gnu', '@rspack/core', '@rspack/binding',
    '@rspack/binding-linux-x64-gnu', 'esbuild', '@sentry/nextjs', '@sentry/node',
    '@sentry/node-core', '@sentry/core', '@opentelemetry/api', '@opentelemetry/sdk-node',
    '@opentelemetry/instrumentation', '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources', '@opentelemetry/semantic-conventions', 'sharp', 'fontkit',
    'ws', 'tesseract.js', 'tesseract.js-core', 'pdf-parse', 'pdfjs-dist', '@napi-rs/canvas',
    'pdfkit', 'pdf-lib', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'openai',
    'stripe', 'ioredis', '@upstash/redis', '@upstash/ratelimit', '@sendgrid/mail',
    'nodemailer', 'resend', '@octokit/rest', '@octokit/auth-oauth-app', 'socket.io',
  ],

  devIndicators: { position: 'bottom-right' },
};

export default adminConfig;
