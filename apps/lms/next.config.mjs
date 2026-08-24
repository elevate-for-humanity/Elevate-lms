import { resolveCommitSha } from '../../scripts/build-identity.mjs';
import { legacyImageRewrites } from '../../lib/media/legacy-image-aliases.mjs';

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

  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },

  async headers() {
    const noStore = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
    return [
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
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins = config.plugins || [];
      config.plugins.push(new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], buffer: 'buffer' }));
    }
    return config;
  },
};
export default nextConfig;
