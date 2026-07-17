/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  experimental: {
    outputFileTracingIncludes: {
      '/api/version': ['./apps/lms/app/**'],
    },
  },
};
export default nextConfig;
