import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/** @type {import('next').NextConfig} */
const __dirname = dirname(fileURLToPath(import.meta.url));
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
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
