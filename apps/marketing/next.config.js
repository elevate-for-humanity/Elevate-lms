import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../..'),
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  staticPageGenerationTimeout: 300,
  skipTrailingSlashRedirect: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@supabase/supabase-js'],
    optimizeCss: false,
    // Reduce memory by disabling some features
    scrollRestoration: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // More aggressive splitting
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
