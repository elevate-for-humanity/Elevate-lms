/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  experimental: {
    outputFileTracingIncludes: {
      '/api/version': ['./apps/marketing/app/**'],
    },
  },
};
export default nextConfig;
