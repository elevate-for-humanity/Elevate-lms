import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { legacyImageRewrites } from '../../lib/media/legacy-image-aliases.mjs';
import { verifiedImageRewrites } from '../../lib/media/verified-image-aliases.mjs';
import { resolveCommitSha } from '../../scripts/build-identity.mjs';
import { withBuildMemoryDefaults } from '../../scripts/build-memory-policy.mjs';

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

  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    // Optimized variants are cached for 30 days so repeat visitors and new
    // Cloud Run instances avoid re-encoding (1-2s cold MISS per image).
    minimumCacheTTL: 2592000,
    // Next defaults deviceSizes up to 3840px, so a full-width hero shipped a
    // ~200KB 3840px variant to every visitor. Cap at 1920px (covers standard
    // desktop) so the responsive srcset never requests the oversized variant.
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [70, 75, 85, 90, 95, 100],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.durable.co' },
      { protocol: 'https', hostname: 'www.elevateforhumanity.org' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Force HTTPS for a year so a downgrade or a stray http:// link
          // cannot be intercepted before it reaches the canonical origin.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Admin Studio embeds deployed marketing pages from its separate origin.
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://admin.elevateforhumanity.org" },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
          },
        ],
      },
    ];
  },

  experimental: { staticGenerationRetryCount: 3 },
  // Next 15 streams metadata into <body> for any UA outside this list, so a
  // crawler that does not execute JavaScript (or reads only <head>) never sees
  // the title, description, canonical or Open Graph tags. The default list
  // omits plain Googlebot, every AI crawler, and common validators, so pages
  // rendered those tags in the body. Force a blocking render for search, social
  // and AI crawlers so metadata is always emitted in <head>. Browsers keep the
  // faster streaming path.
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Googlebot|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|anthropic-ai|PerplexityBot|Perplexity-User|CCBot|Amazonbot|Applebot-Extended|meta-externalagent|cohere-ai|YouBot|Diffbot|Bytespider|PetalBot|SemrushBot|AhrefsBot|MJ12bot|DotBot|squirrelscan/i,
  staticPageGenerationTimeout: 300,
  skipTrailingSlashRedirect: true,
  transpilePackages: ['buffer', 'process'],
  // Keep native/server instrumentation in Node's runtime boundary. Bundling
  // these packages makes webpack inspect require-in-the-middle's intentional
  // dynamic require calls and emits noisy critical-dependency warnings.
  serverExternalPackages: [
    '@lmnr-ai/lmnr',
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
    'require-in-the-middle',
  ],

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
    const publicMarketingHost = process.env.NODE_ENV === 'development'
      ? '(?:www[.]elevateforhumanity[.]org|localhost|127[.]0[.]0[.]1)'
      : 'www[.]elevateforhumanity[.]org';
    const onPublicMarketing = [{ type: 'host', value: publicMarketingHost }];
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
      // Resolve old duplicated path segments before rendering a page. This
      // produces an HTTP redirect rather than a streamed client redirect.
      { source: '/about/mission/mission', destination: '/about', permanent: true },
      { source: '/hire-graduates/hire-graduates', destination: '/employers', permanent: true },
      { source: '/accreditation/accreditation', destination: '/approvals', permanent: true },
      { source: '/for-students/for-students', destination: '/programs', has: onPublicMarketing, permanent: true },
      { source: '/for-students', destination: '/programs', has: onPublicMarketing, permanent: true },
      { source: '/for-employers', destination: '/employers', has: onPublicMarketing, permanent: false },
      { source: '/merigoldround', destination: '/sites/meri-gold-round', permanent: true },
      { source: '/apply/status', destination: '/apply/track', permanent: true },
      { source: '/course-factory', destination: '/ai/course-factory', permanent: true },
      { source: '/compare', destination: '/store#marketplace', permanent: true },
      { source: '/store/white-label', destination: '/white-label', permanent: true },
      { source: '/wioa-training', destination: '/wioa-eligibility', permanent: false },
      { source: '/wioa-funded-training', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/wioa', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/wioa-funding', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/construction', destination: '/programs', permanent: false },
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
      { source: '/videos/cna-hero', destination: '/programs/cna', permanent: true },
    ];
  },



  webpack: (config, { dev, isServer }) => {
    config.parallelism = 1;
    // Preserve live Tailwind updates in development; bound only production CSS.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@marketing-css/core.css$': path.join(__dirname, 'app', dev ? 'globals.css' : 'generated-css/marketing-0.css'),
      ...Object.fromEntries([1, 2, 3].map(index => [
        `@marketing-css/part-${index}.css$`,
        path.join(__dirname, dev ? 'styles/empty.css' : `app/generated-css/marketing-${index}.css`),
      ])),
    };
    // Keep Next-managed cache unless the bounded builder opts out to avoid
    // retaining/serializing a second graph in memory-constrained containers.
    if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') config.cache = false;
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

      // Preserve Next.js client chunking. Forcing every dependency into one
      // vendors chunk groups React with unrelated client modules; the live
      // layout currently fails while reading React's hook dispatcher.
    }

    return config;
  },
};

export default withBuildMemoryDefaults(nextConfig);
