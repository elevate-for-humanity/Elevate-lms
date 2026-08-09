import { resolveCommitSha } from '../../scripts/build-identity.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Deterministic build ID — never use Date.now(), Math.random(), or random UUID.
  generateBuildId: async () => {
    const sha = resolveCommitSha(process.env);
    return sha === 'local-development' ? 'local-dev' : sha.slice(0, 7);
  },

  // Bake deterministic build identity into client bundles at build time.
  env: {
    NEXT_PUBLIC_GIT_SHA: resolveCommitSha(process.env),
    NEXT_PUBLIC_BUILD_ID: `elevate-${resolveCommitSha(process.env)}`,
    NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP ?? 'unknown',
  },

  images: { unoptimized: true },
  typescript: {
    // Disable type checking during build — run separately via `pnpm --filter @elevate/lms exec tsc --noEmit`
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Redirect public Marketing pages to their canonical www destinations.
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

      // Historical Host Site/partner aliases converge on one LMS dashboard.
      { source: '/cosmetology-host-shop', destination: '/host-shop/dashboard', permanent: true },
      { source: '/cosmetology-host-shop/:path*', destination: '/host-shop/dashboard', permanent: true },
      { source: '/partner', destination: '/host-shop/dashboard', permanent: true },
      { source: '/partner/:path*', destination: '/host-shop/dashboard', permanent: true },

      // Admin is a separate standalone application whose dashboard is at root.
      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/dashboard', permanent: true },
      { source: '/admin/:path*', destination: 'https://admin.elevateforhumanity.org/:path*', permanent: true },
    ];
  },
  // Externalize server-only native packages from webpack bundle
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/licensing',
    'esbuild',
  ],
  webpack: (config, { isServer }) => {
    // Browser polyfill for @react-pdf/renderer and other Node.js modules that use Buffer
    if (!isServer) {
      // Access webpack's ProvidePlugin via the compiler instance (webpack 5 API)
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
