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
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: legacyImageRewrites(),
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: '/apply', destination: 'https://www.elevateforhumanity.org/apply/student', permanent: true },
      { source: '/eligibility', destination: 'https://www.elevateforhumanity.org/eligibility/quiz', permanent: true },
      { source: '/programs', destination: 'https://www.elevateforhumanity.org/programs', permanent: true },
      { source: '/about', destination: 'https://www.elevateforhumanity.org/about', permanent: true },
      { source: '/contact', destination: 'https://www.elevateforhumanity.org/contact', permanent: true },
      { source: '/funding', destination: 'https://www.elevateforhumanity.org/funding', permanent: true },
      { source: '/testing', destination: 'https://www.elevateforhumanity.org/testing', permanent: true },
      { source: '/store', destination: 'https://www.elevateforhumanity.org/store', permanent: true },
      { source: '/portal', destination: '/lms/dashboard', permanent: true },
      { source: '/cosmetology-host-shop', destination: '/host-shop/dashboard', permanent: true },
      { source: '/cosmetology-host-shop/:path*', destination: '/host-shop/dashboard', permanent: true },
      { source: '/partner', destination: '/host-shop/dashboard', permanent: true },
      { source: '/partner/:path*', destination: '/host-shop/dashboard', permanent: true },
      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/dashboard', permanent: true },
      { source: '/admin/:path*', destination: 'https://admin.elevateforhumanity.org/:path*', permanent: true },
    ];
  },
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/licensing',
    'esbuild',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
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
    return config;
  },
};
export default nextConfig;
