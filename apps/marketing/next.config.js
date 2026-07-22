import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  staticPageGenerationTimeout: 300,
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      // WIOA redirects
      { source: '/wioa-training', destination: '/wioa-eligibility', permanent: false },
      { source: '/wioa-funded-training', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/wioa', destination: '/wioa-eligibility', permanent: false },
      { source: '/programs/wioa-funding', destination: '/wioa-eligibility', permanent: false },
      // Program redirects
      { source: '/programs/construction', destination: '/programs/skilled-trades', permanent: false },
      { source: '/programs/drug-test', destination: '/programs/drug-collector', permanent: false },
      // Legacy redirects
      { source: '/governance/security', destination: '/legal/disclosures', permanent: false },
      { source: '/legal/agreements', destination: '/legal', permanent: false },
      // Admin redirects
      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/admin/dashboard', permanent: true },
      // Student portal redirects
      { source: '/student-portal/education', destination: '/learner/dashboard', permanent: false },
      // Campaign aliases
      { source: '/intake', destination: '/apply', permanent: false },
      { source: '/snap', destination: '/snap/snap-et', permanent: false },
      // LMS pages -> marketing equivalent
      { source: '/apply', destination: '/apply', permanent: false },
      { source: '/eligibility', destination: '/eligibility', permanent: false },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@supabase/supabase-js'],
    optimizeCss: false,
    scrollRestoration: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }
    return config;
  },
};
export default nextConfig;
