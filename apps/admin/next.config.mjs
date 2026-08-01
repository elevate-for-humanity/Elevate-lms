/**
 * apps/admin/next.config.mjs
 *
 * Standalone Next.js app for admin/instructor/staff/internal APIs.
 * Shared code (lib/, components/, types/) lives at the repo root and is
 * imported via the @/* path alias which resolves to ../../*.
 *
 * Route scope: ~675 routes (admin, instructor, staff, analytics, cron,
 * reports, export, audit) â€” down from 2,706 in the monolith.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { sharedStandaloneTraceExcludes } from '../../scripts/next-standalone-trace-excludes.mjs';
import { resolveCommitSha } from '../../scripts/build-identity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const useStandaloneOutput =
  process.env.GITHUB_ACTIONS !== 'true' || process.env.NEXT_STANDALONE_OUTPUT === '1';

/** @type {import('next').NextConfig} */
const adminConfig = {
  ...(useStandaloneOutput ? { output: 'standalone' } : {}),

  // Deterministic build ID — never use Date.now(), Math.random(), or random UUID.
  // Must match: admin-${GIT_SHA} format for Dockerfile verification
  generateBuildId: async () => {
    const sha = resolveCommitSha(process.env);
    return sha === 'local-development' ? 'admin-local-dev' : `admin-${sha}`;
  },

  // Bake deterministic build identity into client bundles at build time.
  env: {
    NEXT_PUBLIC_GIT_SHA: resolveCommitSha(process.env),
    NEXT_PUBLIC_BUILD_ID: `admin-${resolveCommitSha(process.env)}`,
    NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP ?? 'unknown',
  },

  typescript: { 
    // TODO: Set to false after fixing all TypeScript errors in apps/admin
    ignoreBuildErrors: true, 
  },
  eslint: { 
    // TODO: Set to ignoreDuringBuilds: false after fixing all ESLint errors
    ignoreDuringBuilds: true, 
  },

  experimental: {
    workerThreads: false,
    cpus: 1,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
  },

  // edge-tts ships index.ts as its entry (uncompiled TS) â€” same as root LMS config.
  transpilePackages: ['edge-tts'],

  // Resolve @/* to repo root so shared lib/, components/, types/ work
  webpack(config, { isServer }) {
    config.resolve.alias['@'] = ROOT;
    // For standalone server.js, resolve @/lib/* to TypeScript files for bundling
    if (isServer) {
      config.resolve.alias['@/lib/logger'] = path.join(ROOT, 'lib/logger.ts');
      config.resolve.alias['@/lib/supabase'] = path.join(ROOT, 'lib/supabase');
    }
    // Keep peak memory stable during admin builds on low-RAM runners.
    config.parallelism = 1;
    // Northflank's allowed ephemeral build storage is not large enough for
    // Next's production webpack filesystem cache on this repo.
    if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') {
      config.cache = false;
    }
    return config;
  },

  // Canonical route redirects â€” legacy aliases forward to canonical paths
  async redirects() {
    return [
      // Marketing pages -> main site
      { source: '/apply', destination: 'https://www.elevateforhumanity.org/apply', permanent: false },
      { source: '/eligibility', destination: 'https://www.elevateforhumanity.org/eligibility', permanent: false },
      { source: '/programs', destination: 'https://www.elevateforhumanity.org/programs', permanent: false },
      { source: '/about', destination: 'https://www.elevateforhumanity.org/about', permanent: false },
      { source: '/contact', destination: 'https://www.elevateforhumanity.org/contact', permanent: false },
      { source: '/funding', destination: 'https://www.elevateforhumanity.org/funding', permanent: false },
      { source: '/testing', destination: 'https://www.elevateforhumanity.org/testing', permanent: false },
      { source: '/store', destination: 'https://www.elevateforhumanity.org/store', permanent: false },
      // â”€â”€ Lizzy control plane (retired dev-studio / ai-console admin routes) â”€â”€
      // Do NOT redirect /admin/dashboard â†’ itself (infinite loop).
      { source: '/admin/ai-console', destination: '/admin/dashboard', permanent: true },
      { source: '/admin/ai-console/:path*', destination: '/admin/dashboard', permanent: true },
      { source: '/admin/ai-studio', destination: '/admin/dashboard', permanent: true },
      { source: '/admin/ai-studio/:path*', destination: '/admin/dashboard', permanent: true },
      { source: '/admin/command-center', destination: '/admin/mission-control', permanent: true },
      { source: '/admin/instructors', destination: '/admin/instructor', permanent: true },
      { source: '/admin/performance-dashboard', destination: '/admin/reports', permanent: true },
      { source: '/admin/analytics-dashboard', destination: '/admin/analytics', permanent: true },
      { source: '/admin/payments', destination: '/admin/integrations/stripe', permanent: true },
      { source: '/admin/security', destination: '/admin/settings/security', permanent: true },
      // â”€â”€ Studio consolidation â€” all legacy course/quiz/video/AI surfaces â†’ studio â”€â”€
      { source: '/admin/quizzes', destination: '/admin/dev-studio', permanent: true },
      { source: '/admin/quizzes/:path*', destination: '/admin/dev-studio', permanent: true },
      { source: '/admin/copilot', destination: '/admin/dev-studio', permanent: true },
      { source: '/admin/copilot/:path*', destination: '/admin/dev-studio', permanent: true },
      { source: '/admin/video-manager', destination: '/admin/dev-studio', permanent: true },
      { source: '/admin/video-manager/:path*', destination: '/admin/dev-studio', permanent: true },
      // Dev Studio canonical route
      { source: '/admin/studio', destination: '/admin/dev-studio', permanent: true },
      { source: '/admin/studio/:path*', destination: '/admin/dev-studio/:path*', permanent: true },
      // course-builder redirects removed - page now exists at /admin/course-builder
      // document-center â†’ documents (canonical)
      {
        source: '/admin/document-center',
        destination: '/admin/documents',
        permanent: true,
      },
      {
        source: '/admin/document-center/:path*',
        destination: '/admin/documents/:path*',
        permanent: true,
      },
      // submissions/org â†’ settings/organization-profile (canonical)
      {
        source: '/admin/submissions/org',
        destination: '/admin/settings/organization-profile',
        permanent: false,
      },
    ];
  },

  // Standalone output â€” trace files from repo root so shared lib/ etc. are included
  outputFileTracingRoot: ROOT,

  // Same monorepo-wide excludes as LMS â€” keeps playwright/puppeteer/three/etc.
  // out of standalone. Admin keeps Remotion (see lmsOnly excludes in shared module).
  outputFileTracingExcludes: {
    '*': sharedStandaloneTraceExcludes,
  },

  // Force-include critical server-side files in standalone output
  outputFileTracingIncludes: {
    '/api/**': ['lib/logger.ts'],
    '/admin/**': ['lib/logger.ts'],
  },

  serverExternalPackages: [
    // Remotion â€” /api/admin/generate-lesson-videos (dynamic import of remotion-render)
    'remotion',
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/compositor-linux-x64-gnu',
    '@rspack/core',
    '@rspack/binding',
    '@rspack/binding-linux-x64-gnu',
    'esbuild',
    // Sentry + OpenTelemetry â€” dynamic require() patterns break webpack
    '@sentry/nextjs',
    '@sentry/node',
    '@sentry/node-core',
    '@sentry/core',
    '@opentelemetry/api',
    '@opentelemetry/sdk-node',
    '@opentelemetry/instrumentation',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
    'sharp',
    'fontkit',
    // edge-tts: transpilePackages only (conflicts if also listed here)
    // ws â€” custom server.js only
    'ws',
    // Document OCR / extract admin APIs
    'tesseract.js',
    'tesseract.js-core',
    'pdf-parse',
    'pdfjs-dist',
    '@napi-rs/canvas',
    'pdfkit',
    'pdf-lib',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'openai',
    'stripe',
    'ioredis',
    '@upstash/redis',
    '@upstash/ratelimit',
    '@sendgrid/mail',
    'nodemailer',
    'resend',
    '@octokit/rest',
    '@octokit/auth-oauth-app',
    'socket.io',
  ],

  devIndicators: { position: 'bottom-right' },
};

export default adminConfig;
