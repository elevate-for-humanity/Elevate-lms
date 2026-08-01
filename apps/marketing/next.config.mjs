import { resolveCommitSha } from '../../scripts/build-identity.mjs';
import path from 'node:path';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Must trace from workspace root so .next dir ends up at /app/apps/marketing/.next/
  // matching Dockerfile COPY paths: /app/apps/marketing/.next ./.next
  outputFileTracingRoot: path.join(__dirname, '../..'),

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
  async redirects() {
    return [
      // ============================================================
      // ADMIN APP ROUTES — all /admin/* routes belong on admin. subdomain
      // ============================================================
      { source: '/admin', destination: 'https://admin.elevateforhumanity.org/admin', permanent: false },
      { source: '/admin/:path*', destination: 'https://admin.elevateforhumanity.org/admin/:path*', permanent: false },

      // ============================================================
      // LMS APP ROUTES — portal routes belong on app. subdomain
      // IMPORTANT: Must come before any marketing catch-alls for the same prefix.
      // ============================================================
      { source: '/lms/:path*', destination: 'https://app.elevateforhumanity.org/lms/:path*', permanent: false },
      { source: '/employer/:path*', destination: 'https://app.elevateforhumanity.org/employer/:path*', permanent: false },
      { source: '/apprentice/:path*', destination: 'https://app.elevateforhumanity.org/apprentice/:path*', permanent: false },
      { source: '/parent-portal/:path*', destination: 'https://app.elevateforhumanity.org/parent-portal/:path*', permanent: false },
      { source: '/workforce/:path*', destination: 'https://app.elevateforhumanity.org/workforce/:path*', permanent: false },
      { source: '/cosmetology-host-shop/:path*', destination: 'https://app.elevateforhumanity.org/cosmetology-host-shop/:path*', permanent: false },
      { source: '/host-shop/:path*', destination: 'https://app.elevateforhumanity.org/host-shop/:path*', permanent: false },

      // Partner routes — redirect to LMS app (the LMS app has /partner/dashboard etc.)
      // The marketing /partner/* catch-all page.tsx is OVERRIDDEN by this redirect.
      { source: '/partner', destination: 'https://app.elevateforhumanity.org/partner/dashboard', permanent: false },
      { source: '/partner/:path*', destination: 'https://app.elevateforhumanity.org/partner/:path*', permanent: false },
    ];
  },
};
export default nextConfig;
