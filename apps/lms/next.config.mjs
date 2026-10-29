import { resolveCommitSha } from '../../scripts/build-identity.mjs';
import { legacyImageRewrites } from '../../lib/media/legacy-image-aliases.mjs';
import { withBuildMemoryDefaults } from '../../scripts/build-memory-policy.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  generateBuildId: async () => {
    const sha = resolveCommitSha(process.env);
    return sha === 'local-development' ? 'local-dev' : sha.slice(0, 7);
  },

  env: {
    NEXT_PUBLIC_GIT_SHA: resolveCommitSha(process.env),
    NEXT_PUBLIC_BUILD_ID: `elevate-${resolveCommitSha(process.env)}`,
    NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP ?? 'unknown',
  },

  // Multipart overhead must fit above the validated 10 MB photo/document limit.
  experimental: { serverActions: { bodySizeLimit: '12mb' } },

  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  // Keep observability instrumentation in Node's runtime boundary. Bundling
  // these packages makes webpack inspect intentional dynamic require calls.
  serverExternalPackages: [
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
    // edge-tts ships TypeScript source in its package. Keep it outside the
    // Next/Webpack bundle so Node loads it through the server runtime path.
    'edge-tts',
    // Kokoro loads platform-specific ONNX native bindings at runtime. These
    // must be traced as server dependencies instead of parsed by webpack.
    'kokoro-js',
    '@huggingface/transformers',
    'onnxruntime-node',
  ],

  async headers() {
    const noStore = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        // Next's configured headers replace the route's response headers.
        // Recovery owns distinct GET/POST policies: its confirmation form must
        // retain a same-origin POST, while redirects suppress all referrers.
        source: '/:path((?!api/auth/recovery-callback(?:/)?$).*)',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
      {
        // Keep legacy same-origin framing outside the signed course-preview
        // handoff and lesson surfaces. Their CSP admits only the owning Admin.
        source: '/:path((?!api/admin/course-preview$|lms/courses(?:/|$)).*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
      ...['/api/admin/course-preview', '/lms/courses/:path*'].map(source => ({
        source,
        headers: [{
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'self' https://admin.elevateforhumanity.org; object-src 'none'; base-uri 'self'",
        }],
      })),
      {
        source: '/workbooks/:path*',
        headers: [
          { key: 'Cache-Control', value: noStore },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/apprentice/workbook/:path*',
        headers: [
          { key: 'Cache-Control', value: noStore },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/sw-lms.js',
        headers: [
          { key: 'Cache-Control', value: noStore },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest-:role.json',
        headers: [{ key: 'Cache-Control', value: noStore }],
      },
      {
        source: '/offline.html',
        headers: [{ key: 'Cache-Control', value: noStore }],
      },
    ];
  },

  async rewrites() {
    return { beforeFiles: legacyImageRewrites(), afterFiles: [], fallback: [] };
  },
  async redirects() {
    return [
      { source: '/', destination: '/login', permanent: false },
      { source: '/reset', destination: '/support/reset-browser', permanent: true },
      { source: '/reset/done', destination: '/support/reset-browser/done', permanent: true },
      { source: '/partners/dashboard', destination: '/host-shop/dashboard', permanent: true },
      { source: '/partner/dashboard', destination: '/host-shop/dashboard', permanent: false },
      { source: '/partners/workforce', destination: '/workforce', permanent: true },
      { source: '/host-shop/dashboard/apprentices/new', destination: '/host-shop/dashboard/match-requests', permanent: true },
      { source: '/apply', destination: 'https://www.elevateforhumanity.org/apply/student', permanent: true },
      { source: '/eligibility', destination: 'https://www.elevateforhumanity.org/eligibility/quiz', permanent: true },
      { source: '/programs', destination: 'https://www.elevateforhumanity.org/programs', permanent: true },
      { source: '/about', destination: 'https://www.elevateforhumanity.org/about', permanent: true },
      { source: '/contact', destination: 'https://www.elevateforhumanity.org/contact', permanent: true },
      { source: '/funding', destination: 'https://www.elevateforhumanity.org/funding', permanent: true },
      { source: '/testing', destination: 'https://www.elevateforhumanity.org/testing', permanent: true },
      { source: '/store', destination: 'https://www.elevateforhumanity.org/store', permanent: true },
    ];
  },
  webpack: (config, { dev, isServer, webpack }) => {
    if (!isServer) {
      config.plugins = config.plugins || [];
      config.plugins.push(new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], buffer: 'buffer' }));
    }
    if (!dev) config.cache = false;
    return config;
  },
};
export default withBuildMemoryDefaults(nextConfig);
