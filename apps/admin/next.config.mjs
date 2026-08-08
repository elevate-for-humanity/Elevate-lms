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
      // Only genuine cross-application redirects belong here.
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
