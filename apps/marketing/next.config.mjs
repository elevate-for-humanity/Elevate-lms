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
