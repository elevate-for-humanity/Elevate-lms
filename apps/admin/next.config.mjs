/**
 * apps/admin/next.config.mjs
 *
 * Standalone Next.js app for admin/instructor/staff/internal APIs.
 * Shared code (lib/, components/, types/) lives at the repo root and is
 * imported via the @/* path alias which resolves to ../../*.
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

  webpack(config, { isServer }) {
    config.resolve.alias['@'] = ROOT;
    if (isServer) {
      config.resolve.alias['@/lib/logger'] = path.join(ROOT, 'lib/logger.ts');
      config.resolve.alias['@/lib/supabase'] = path.join(ROOT, 'lib/supabase');
    }
    config.parallelism = 1;
    if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') config.cache = false;
    if (!isServer) {
      const webpack = config.compiler?.webpack;
      if (webpack?.ProvidePlugin) {
        config.plugins = config.plugins || [];
        config.plugins.push(
          new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], buffer: 'buffer' }),
        );
      }
    }
    return config;
  },

  async redirects() {
    return [
      // Public Marketing-only pages that have no Admin implementation.
      { source: '/apply', destination: 'https://www.elevateforhumanity.org/apply', permanent: false },
      { source: '/eligibility', destination: 'https://www.elevateforhumanity.org/eligibility', permanent: false },
      { source: '/about', destination: 'https://www.elevateforhumanity.org/about', permanent: false },
      { source: '/contact', destination: 'https://www.elevateforhumanity.org/contact', permanent: false },
      { source: '/testing', destination: 'https://www.elevateforhumanity.org/testing', permanent: false },
      { source: '/store', destination: 'https://www.elevateforhumanity.org/store', permanent: false },

      // Canonical Admin business-route aliases. The standalone admin app owns
      // these implementations at root paths, while older dashboards/nav still
      // reference /admin/*. Keep both URL shapes functional without duplicate pages.
      { source: '/admin/testing-center', destination: '/testing-center', permanent: false },
      { source: '/admin/testing-center/:path*', destination: '/testing-center/:path*', permanent: false },
      { source: '/admin/billing', destination: '/billing', permanent: false },
      { source: '/admin/billing/:path*', destination: '/billing/:path*', permanent: false },
      { source: '/admin/intelligence', destination: '/intelligence', permanent: false },
      { source: '/admin/intelligence/:path*', destination: '/intelligence/:path*', permanent: false },
      { source: '/admin/operations', destination: '/operations', permanent: false },
      { source: '/admin/operations/:path*', destination: '/operations/:path*', permanent: false },
      { source: '/admin/mission-control', destination: '/mission-control', permanent: false },
      { source: '/admin/mission-control/:path*', destination: '/mission-control/:path*', permanent: false },
      { source: '/admin/system-health', destination: '/system-health', permanent: false },
      { source: '/admin/system-health/:path*', destination: '/system-health/:path*', permanent: false },
      { source: '/admin/funding', destination: '/funding', permanent: false },
      { source: '/admin/funding/:path*', destination: '/funding/:path*', permanent: false },
      { source: '/admin/program-holders', destination: '/program-holders', permanent: false },
      { source: '/admin/program-holders/:path*', destination: '/program-holders/:path*', permanent: false },
      { source: '/admin/documents/review', destination: '/documents/review', permanent: false },
      { source: '/admin/documents/review/:path*', destination: '/documents/review/:path*', permanent: false },
      { source: '/admin/wioa', destination: '/wioa', permanent: false },
      { source: '/admin/wioa/:path*', destination: '/wioa/:path*', permanent: false },
      { source: '/admin/employers', destination: '/employers', permanent: false },
      { source: '/admin/employers/:path*', destination: '/employers/:path*', permanent: false },
      { source: '/admin/integrations/stripe', destination: '/integrations/stripe', permanent: false },
      { source: '/admin/integrations/stripe/:path*', destination: '/integrations/stripe/:path*', permanent: false },
      { source: '/admin/tenants', destination: '/tenants', permanent: false },
      { source: '/admin/tenants/:path*', destination: '/tenants/:path*', permanent: false },
      { source: '/admin/compliance', destination: '/compliance', permanent: false },
      { source: '/admin/compliance/:path*', destination: '/compliance/:path*', permanent: false },
      { source: '/admin/crm', destination: '/crm', permanent: false },
      { source: '/admin/crm/:path*', destination: '/crm/:path*', permanent: false },
      { source: '/admin/audit-logs', destination: '/audit-logs', permanent: false },
      { source: '/admin/audit-logs/:path*', destination: '/audit-logs/:path*', permanent: false },

      // Retired Admin aliases.
      { source: '/admin/ai-console', destination: '/admin/studio', permanent: true },
      { source: '/admin/ai-console/:path*', destination: '/admin/studio', permanent: true },
      { source: '/admin/ai-studio', destination: '/admin/studio', permanent: true },
      { source: '/admin/ai-studio/:path*', destination: '/admin/studio', permanent: true },
      { source: '/admin/command-center', destination: '/mission-control', permanent: true },
      { source: '/admin/instructors', destination: '/instructor', permanent: true },
      { source: '/admin/performance-dashboard', destination: '/reports', permanent: true },
      { source: '/admin/analytics-dashboard', destination: '/analytics', permanent: true },
      { source: '/admin/payments', destination: '/integrations/stripe', permanent: true },
      { source: '/admin/security', destination: '/settings/security', permanent: true },

      // Legacy Studio tools converge on Dev Studio. The unified Course Builder
      // remains a real route at /admin/course-builder and must not redirect away.
      { source: '/admin/quizzes', destination: '/admin/studio', permanent: true },
      { source: '/admin/quizzes/:path*', destination: '/admin/studio', permanent: true },
      { source: '/admin/copilot', destination: '/admin/studio', permanent: true },
      { source: '/admin/copilot/:path*', destination: '/admin/studio', permanent: true },
      { source: '/admin/video-manager', destination: '/admin/course-builder', permanent: true },
      { source: '/admin/video-manager/:path*', destination: '/admin/course-builder', permanent: true },

      { source: '/admin/document-center', destination: '/documents', permanent: true },
      { source: '/admin/document-center/:path*', destination: '/documents/:path*', permanent: true },
      { source: '/admin/submissions/org', destination: '/settings/organization-profile', permanent: false },

      // Legacy duplicate business URLs resolve to one implementation.
      { source: '/admin/dashboard', destination: '/dashboard', permanent: true },
      { source: '/admin/programs', destination: '/programs', permanent: true },
      { source: '/admin/students', destination: '/students', permanent: true },
      { source: '/admin/applications', destination: '/applications', permanent: true },
      { source: '/admin/credentials', destination: '/credentials', permanent: true },
      { source: '/admin/staff', destination: '/staff', permanent: true },
      { source: '/admin/reports', destination: '/reports', permanent: true },
      { source: '/admin/enrollments', destination: '/enrollments', permanent: true },
      { source: '/admin/staff-portal', destination: '/staff-portal', permanent: true },
      { source: '/admin/staff-portal/:path*', destination: '/staff-portal/:path*', permanent: true },
      { source: '/admin/testing', destination: '/testing-center', permanent: true },
      { source: '/admin/analytics', destination: '/analytics', permanent: true },
      { source: '/admin/contracts', destination: '/contracts', permanent: true },
      { source: '/admin/grants', destination: '/grants', permanent: true },
      { source: '/admin/grants/applications/new', destination: '/grants', permanent: true },
      { source: '/admin/grants/opportunities', destination: '/grants', permanent: true },
      { source: '/admin/settings/organization-profile', destination: '/settings/organization-profile', permanent: true },
      { source: '/admin/courses/new', destination: '/courses', permanent: true },
      { source: '/admin/governance/data', destination: '/governance', permanent: true },
      { source: '/admin/signatures', destination: '/signatures', permanent: true },
      { source: '/admin/mou', destination: '/mou', permanent: true },
      { source: '/admin/hr/employees', destination: '/hr', permanent: true },
      { source: '/admin/hr/payroll', destination: '/hr', permanent: true },
      { source: '/admin/hr/time', destination: '/hr', permanent: true },
      { source: '/admin/hr/leave', destination: '/hr', permanent: true },
      { source: '/admin/instructor-credentials', destination: '/instructor-credentials', permanent: true },
      { source: '/admin/enrollment', destination: '/enrollments', permanent: true },
      { source: '/admin/website-editor', destination: '/admin/studio', permanent: true },
      { source: '/admin/booth-renters', destination: '/staff-portal', permanent: true },
      { source: '/admin/campaigns', destination: '/communications', permanent: true },
    ];
  },

  outputFileTracingRoot: ROOT,
  outputFileTracingExcludes: { '*': sharedStandaloneTraceExcludes },
  outputFileTracingIncludes: {
    '/api/**': ['lib/logger.ts'],
    '/admin/**': ['lib/logger.ts'],
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
