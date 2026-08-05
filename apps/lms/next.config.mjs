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
  // Redirect marketing pages to main site
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
      { source: '/portal', destination: 'https://www.elevateforhumanity.org/portals', permanent: false },
      // Admin -> admin site
      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/admin/dashboard', permanent: true },
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
