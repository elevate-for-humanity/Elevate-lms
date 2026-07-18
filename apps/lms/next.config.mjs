import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/** @type {import('next').NextConfig} */
const __dirname = dirname(fileURLToPath(import.meta.url));
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  typescript: {
    // Disable type checking during build — run separately via `pnpm --filter @elevate/lms exec tsc --noEmit`
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Externalize server-only native packages from webpack bundle
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/licensing',
    'esbuild',
  ],
  webpack: (config) => {
    // Map @ to repo root where lms-data lives
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, '../..'),
    };
    return config;
  },
};
export default nextConfig;
