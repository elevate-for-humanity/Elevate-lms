/**
 * apps/admin/next.config.mjs
 *
 * Standalone Next.js app for admin/instructor/staff/internal APIs.
 * Shared code (lib/, components/, types/) lives at the repo root and is
 * imported via the @/* path alias which resolves to ../../*.
 *
 * Route scope: ~675 routes (admin, instructor, staff, analytics, cron,
 * reports, export, audit) — down from 2,706 in the monolith.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { sharedStandaloneTraceExcludes } from '../../scripts/next-standalone-trace-excludes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const useStandaloneOutput =
  process.env.GITHUB_ACTIONS !== 'true' || process.env.NEXT_STANDALONE_OUTPUT === '1';

/** @type {import('next').NextConfig} */
const adminConfig = {
  ...(useStandaloneOutput ? { output: 'standalone' } : {}),

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  experimental: {
    workerThreads: false,
    cpus: 1,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
  },

  // edge-tts ships index.ts as its entry (uncompiled TS) — same as root LMS config.
  transpilePackages: ['edge-tts'],

  // Resolve @/* to repo root so shared lib/, components/, types/ work
  webpack(config) {
    config.resolve.alias['@'] = ROOT;
    // Keep peak memory stable during admin builds on low-RAM runners.
    config.parallelism = 1;
    // Northflank's allowed ephemeral build storage is not large enough for
    // Next's production webpack filesystem cache on this repo.
    if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') {
      config.cache = false;
    }
    return config;
  },

  // Canonical route redirects — legacy aliases forward to canonical paths
  async redirects() {
    return [
      // ── Lizzy control plane (retired dev-studio / ai-console admin routes) ──
      // Do NOT redirect /admin/dashboard → itself (infinite loop).
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
      // ── Studio consolidation — all legacy course/quiz/video/AI surfaces → studio ──
      { source: '/admin/quizzes', destination: '/admin/studio', permanent: true },
      { source: '/admin/quizzes/:path*', destination: '/admin/studio', permanent: true },
      { source: '/admin/copilot', destination: '/admin/studio', permanent: true },
      { source: '/admin/copilot/:path*', destination: '/admin/studio', permanent: true },
      { source: '/admin/video-manager', destination: '/admin/studio', permanent: true },
      { source: '/admin/video-manager/:path*', destination: '/admin/studio', permanent: true },
      { source: '/admin/course-builder', destination: '/admin/studio', permanent: true },
      { source: '/admin/course-builder/assessments', destination: '/admin/studio', permanent: true },
      { source: '/admin/course-builder/generate', destination: '/admin/studio', permanent: true },
      { source: '/admin/course-builder/media', destination: '/admin/studio', permanent: true },
      { source: '/admin/course-builder/templates', destination: '/admin/studio', permanent: true },
      {
        source: '/admin/course-builder/:courseId',
        destination: '/admin/studio/:courseId',
        permanent: true,
      },
      // document-center → documents (canonical)
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
      // submissions/org → settings/organization-profile (canonical)
      {
        source: '/admin/submissions/org',
        destination: '/admin/settings/organization-profile',
        permanent: false,
      },
    ];
  },

  // Standalone output — trace files from repo root so shared lib/ etc. are included
  outputFileTracingRoot: ROOT,

  // Same monorepo-wide excludes as LMS — keeps playwright/puppeteer/three/etc.
  // out of standalone. Admin keeps Remotion (see lmsOnly excludes in shared module).
  outputFileTracingExcludes: {
    '*': sharedStandaloneTraceExcludes,
  },

  serverExternalPackages: [
    // Remotion — /api/admin/generate-lesson-videos (dynamic import of remotion-render)
    'remotion',
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/compositor-linux-x64-gnu',
    '@rspack/core',
    '@rspack/binding',
    '@rspack/binding-linux-x64-gnu',
    'esbuild',
    // Sentry + OpenTelemetry — dynamic require() patterns break webpack
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
    // edge-tts: transpilePackages only (conflicts if also listed here)
    // ws — custom server.js only
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
