import { withSentryConfig } from '@sentry/nextjs';
import fs from 'node:fs';
import path from 'node:path';
import {
  lmsOnlyStandaloneTraceExcludes,
  sharedStandaloneTraceExcludes,
} from './scripts/next-standalone-trace-excludes.mjs';
import { resolveCommitSha } from './scripts/build-identity.mjs';

const useStandaloneOutput =
  process.env.GITHUB_ACTIONS !== 'true' || process.env.NEXT_STANDALONE_OUTPUT === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Next's built-in lint step during build - ESLint runs separately
  serverExternalPackages: [
    'tesseract.js',
    'tesseract.js-core',
    'sharp',
    'pdf-parse',
    'pdfjs-dist',
    '@napi-rs/canvas',
    'pdfkit',
    'pdf-lib',
    'jspdf',
    'jspdf-autotable',
    '@react-pdf/renderer',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'pg',
    'openai',
    'stripe',
    'ioredis',
    'redis',
    '@upstash/redis',
    'socket.io',
    'socket.io-client',
    '@sendgrid/mail',
    'nodemailer',
    '@sentry/nextjs',
    '@sentry/node',
    '@sentry/node-core',
    '@sentry/core',
    '@apm-js-collab/tracing-hooks',
    '@apm-js-collab/code-transformer',
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/compositor-linux-x64-gnu',
    '@rspack/core',
    '@rspack/binding',
    '@rspack/binding-linux-x64-gnu',
    'remotion',
    '@opentelemetry/api',
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
    'puppeteer',
    'puppeteer-core',
    'playwright',
    'chromium-bidi',
    'typescript',
    'core-js',
    '@upstash/ratelimit',
    '@mailchimp/mailchimp_marketing',
    '@octokit/rest',
    '@octokit/auth-oauth-app',
    '@webcontainer/api',
    'cheerio',
    'docx',
    'fast-xml-parser',
    'jszip',
    'qrcode',
    'resend',
    'speakeasy',
    'web-push',
    'yjs',
    'y-websocket',
  ],

  devIndicators: {
    position: 'bottom-right',
  },

  generateBuildId: async () => {
    // Deterministic build ID: always derived from the canonical commit SHA.
    // Uses GIT_SHA > GITHUB_SHA > NEXT_PUBLIC_GIT_SHA > COMMIT_SHA.
    // Falls back to 'local-dev' only in non-production environments.
    // NEVER uses Date.now(), Math.random(), or random UUID.
    const sha = resolveCommitSha(process.env);
    return sha === 'local-development' ? 'local-dev' : sha.slice(0, 7);
  },

  // Expose deterministic build identity to client bundles.
  // These are baked into .next/BUILD_ID at build time (not runtime env).
  env: {
    NEXT_PUBLIC_GIT_SHA: resolveCommitSha(process.env),
    NEXT_PUBLIC_BUILD_ID: `elevate-${resolveCommitSha(process.env)}`,
    NEXT_PUBLIC_BUILD_TIMESTAMP:
      process.env.BUILD_TIMESTAMP ?? 'unknown',
  },

  ...(useStandaloneOutput ? { output: 'standalone' } : {}),
  transpilePackages: ['edge-tts'],

  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  images: {
    // Enable unoptimized for standalone/docker deployments
    // Next.js image optimization doesn't work in standalone mode without external image optimization API
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [70, 75, 85, 90, 95],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.elevateforhumanity.org' },
      { protocol: 'https', hostname: 'www.elevateforhumanity.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflarestream.com' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
      { protocol: 'https', hostname: 'cdn.elevatelms.com' },
      { protocol: 'https', hostname: 'cms-artifacts.artlist.io' },
      { protocol: 'https', hostname: 'cdn1.affirm.com' },
    ],
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  allowedDevOrigins: ['localhost'],

  modularizeImports: {
    // Split lucide icons into individual imports for better tree-shaking
    '^lucide-react$': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      skipDefaultConversion: true,
    },
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-'],
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
    optimizeCss: false,
  },

  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  webpack: (config, { isServer }) => {
    // webpack 5 polyfills node core modules automatically but requires explicit configuration
    // for modules like buffer that need browser polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };

      // Use ProvidePlugin to make buffer available as a global in the browser
      // This is needed because @react-pdf/renderer and other libraries use Buffer
      const webpack = config.compiler?.webpack;
      if (webpack?.ProvidePlugin) {
        config.plugins = config.plugins || [];
        config.plugins.push(
          new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            buffer: 'buffer',
          })
        );
      }
    }

    // Webpack cache configuration for consistent builds
    // - Enable filesystem cache when NEXT_BUILD_CACHE is set (Northflank persistent /cache/.next)
    // - This ensures consistent Server Action IDs across builds
    // - Only disable if DISABLE_WEBPACK_FILESYSTEM_CACHE='1'
    if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') {
      config.cache = false;
    } else if (process.env.NEXT_BUILD_CACHE) {
      // Next.js auto-detects NEXT_BUILD_CACHE and enables filesystem cache
      // No explicit config needed - ensures stable Server Action IDs
    } else if (process.env.CI === 'true') {
      // CI without persistent cache - disable to avoid stale cache
      config.cache = false;
    }

    // Use Next.js default splitChunks  the custom config above was creating
    // one chunk per npm package (name() function), generating thousands of
    // chunks and holding the entire module graph in memory simultaneously.
    // On a 2,500+ page app this caused OOM on every cold build.
    // Let Next.js manage chunking; it's tuned for this scale.
    return config;
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingExcludes: {
    '/api/devstudio/files': ['**/*'],
    '/api/devstudio/shell': ['**/*'],
    '/api/accreditation/report': ['**/*'],
    '*': [...sharedStandaloneTraceExcludes, ...lmsOnlyStandaloneTraceExcludes],
  },

  // Include lib/supabase in standalone builds to fix runtime errors
  outputFileTracingIncludes: {
    '/**': ['lib/supabase/**', 'lib/logger.ts'],
  },

  async redirects() {
    // NOTE: All legacy/admin/lms redirect rules have been removed.
    // Nav links now point directly to correct pages. No redirect patching needed.
    // Portal routing is handled by middleware.ts at the edge level.

    return [
      // ── Domain routing: elevateforhumanity.org → www ──────────────────────
      {
        source: '/',
        has: [{ type: 'host', value: 'elevateforhumanity.org' }],
        destination: 'https://www.elevateforhumanity.org/',
        permanent: true,
      },
      {
        source: '/:path+',
        has: [{ type: 'host', value: 'elevateforhumanity.org' }],
        destination: 'https://www.elevateforhumanity.org/:path+',
        permanent: true,
      },

      // ── Public legacy compatibility routes ────────────────────────────────
      ...[
        { source: '/home', destination: '/' },
        { source: '/index.html', destination: '/' },
        { source: '/training', destination: '/programs' },
        { source: '/terms-and-conditions', destination: '/terms-of-service' },
        { source: '/legal/terms-of-service', destination: '/terms-of-service' },
        { source: '/student-handbook', destination: '/legal/student-handbook' },
        { source: '/dashboard', destination: 'https://app.elevateforhumanity.org/lms/dashboard' },
      ].map((route) => ({
        ...route,
        has: [{ type: 'host', value: 'www.elevateforhumanity.org' }],
        permanent: true,
      })),

      // ── Video asset ──────────────────────────────────────────────────────
      {
        source: '/videos/barber-hero-final.mp4',
        destination: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/barber-hero.mp4',
        permanent: false,
      },
    ];
  },


  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    const isPreview =
      process.env.CONTEXT === 'deploy-preview' || process.env.CONTEXT === 'branch-deploy';

    const robotsHeaders = [];

    const securityHeaders = [
      ...robotsHeaders,
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      ...(isProduction
        ? [{ key: 'X-Frame-Options', value: 'DENY' }]
        : []),
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          isProduction
            ? "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://www.googletagmanager.com https://widget.sezzle.com https://challenges.cloudflare.com"
            : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://www.googletagmanager.com https://widget.sezzle.com https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://images.pexels.com https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev https://cms-artifacts.artlist.io https://*.r2.dev https://cdn.elevatelms.com https://*.githubusercontent.com https://cdn1.affirm.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co https://us06web.zoom.us https://*.sentry.io https://www.google-analytics.com https://region1.google-analytics.com",
          "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://js.stripe.com https://us06web.zoom.us https://challenges.cloudflare.com https://*.cloudflarestream.com https://calendly.com",
          "media-src 'self' data: blob: https://*.supabase.co https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev https://cms-artifacts.artlist.io https://*.r2.dev https://cdn.elevatelms.com https://*.cloudflarestream.com",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https://js.stripe.com",
          "frame-ancestors 'self' https://www.elevateforhumanity.org https://elevateforhumanity.org https://admin.elevateforhumanity.org https://app.elevateforhumanity.org",
          'upgrade-insecure-requests',
          'report-uri /api/csp-report',
          'report-to csp-endpoint',
        ].join('; '),
      },
      {
        key: 'Report-To',
        value: JSON.stringify({
          group: 'csp-endpoint',
          max_age: 86400,
          endpoints: [{ url: '/api/csp-report' }],
        }),
      },
    ];

    if (isPreview) {
      securityHeaders.push({
        key: 'X-Robots-Tag',
        value: 'noindex, nofollow, noarchive',
      });
    }

    return [
      {
        source: '/studio/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Build-ID', value: process.env.BUILD_ID?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
        ],
      },
      {
        source: '/studio',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Build-ID', value: process.env.BUILD_ID?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
        ],
      },
      {
        source: '/(|about|about/mission|about/team|about/partners|blog|careers|contact|credentials|dmca|donate|eligibility|faq|for-employers|for-students|how-it-works|jri|news|partners|press|resources|scholarships|services|site-map|training|transparency|tuition|verify|workkeys|mobile-app|install-app|career-training-indiana|certification-testing|check-eligibility|call-now|career-assessment|career-counseling|workforce-training-indianapolis|healthcare-training-indianapolis|skilled-trades-training-indiana|it-certification-training-indianapolis|employer-workforce-partnerships-indiana|agency-referral-workforce-training-indiana|wioa-eligibility)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
          { key: 'X-Build-ID', value: process.env.BUILD_ID?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
          { key: 'X-Deployment-ID', value: process.env.BUILD_ID || process.env.DEPLOY_ID || 'local' },
          ...securityHeaders,
        ],
      },
      {
        source: '/programs/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
          { key: 'X-Build-ID', value: process.env.BUILD_ID?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
          { key: 'X-Deployment-ID', value: process.env.BUILD_ID || process.env.DEPLOY_ID || 'local' },
          ...securityHeaders,
        ],
      },
      {
        source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|studio|programs).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
          { key: 'X-Build-ID', value: process.env.BUILD_ID?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
          { key: 'X-Deployment-ID', value: process.env.BUILD_ID || process.env.DEPLOY_ID || 'local' },
          ...securityHeaders,
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Server action chunks - prevent caching to fix "Failed to find Server Action" errors
      {
        source: '/_next/server/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:path*.css',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/:path*.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
        ],
      },
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
        ],
      },
    ];
  },
};

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  autoInstrumentMiddleware: false,
  webpack: {
    autoInstrumentMiddleware: false,
  },
  disableLogger: true,
  widenClientFileUpload: false,
};

const skipSentry = process.env.BUILD_SCOPE === '1';

export default skipSentry
  ? nextConfig
  : withSentryConfig(nextConfig, sentryWebpackPluginOptions);
