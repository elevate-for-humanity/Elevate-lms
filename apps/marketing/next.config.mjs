/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
      // ============================================================
      { source: '/lms/:path*', destination: 'https://app.elevateforhumanity.org/lms/:path*', permanent: false },
      { source: '/employer/:path*', destination: 'https://app.elevateforhumanity.org/employer/:path*', permanent: false },
      { source: '/apprentice/:path*', destination: 'https://app.elevateforhumanity.org/apprentice/:path*', permanent: false },
      { source: '/parent-portal/:path*', destination: 'https://app.elevateforhumanity.org/parent-portal/:path*', permanent: false },
      { source: '/workforce/:path*', destination: 'https://app.elevateforhumanity.org/workforce/:path*', permanent: false },
      { source: '/cosmetology-host-shop/:path*', destination: 'https://app.elevateforhumanity.org/cosmetology-host-shop/:path*', permanent: false },
      { source: '/host-shop/dashboard', destination: 'https://app.elevateforhumanity.org/host-shop/dashboard', permanent: false },

      // ============================================================
      // MARKETING PAGE ROUTES — routes that exist in marketing app
      // (no redirect needed, just serving the page)
      // ============================================================
      // workforce-board, case-manager, provider, partner, staff, program-holder
      // all exist in marketing app — no redirect needed.

      // ============================================================
      // LEGACY ADMIN ALIASES — these redirect WITHIN the admin app
      // (now captured by /admin/:path* above which routes to admin.)
      // ============================================================
      // Note: These are relative redirects that used to be in root next.config.mjs.
      // Since /admin/* now routes to admin. subdomain, these are handled there.
    ];
  },
};
export default nextConfig;
