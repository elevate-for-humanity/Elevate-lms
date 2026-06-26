import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo/siteMetadata';

export default function robots(): MetadataRoute.Robots {
  // Block all indexing on preview/branch deployments
  if (process.env.ROBOTS_NOINDEX === 'true') {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // API and auth
          '/api/',
          '/auth/',
          '/login',
          '/signup',
          '/reset-password',

          // Protected portals
          '/admin/',
          '/lms/',
          '/dashboard/',
          '/learner/dashboard/',
          '/admin/staff-portal/',
          '/partner/',

          '/onboarding/',
          '/settings/',

          // Role-specific dashboards
          '/instructor/',
          '/creator/',
          '/learner/',
          '/mentor/',
          '/portal/',
          '/program-holder/dashboard',
          '/workforce-board/dashboard',
          '/employer/dashboard',
          '/employer/settings',
          '/partner/dashboard',
          '/partner/login',
          '/partner/settings',
          '/partner/onboarding',
          '/student/',

          // LMS protected routes
          '/lms/dashboard',
          '/lms/profile',
          '/lms/settings',
          '/lms/messages',
          '/lms/certificates',
          '/lms/grades',

          // Checkout and payment
          '/checkout/',
          '/enroll/',
          '/payment/',

          // Internal
          '/shop/checkout',
          '/shop/onboarding',

          // Preview and builder
          '/builder/',

          // Demo surfaces — not production content
          '/demo/',
          '/demos/',
          '/store/demo/',
          '/store/demos/',

          // Query-string variants — not canonical, block indexing
          '/programs?*',
          '/search?*',

          // Filter/search pages — thin, not canonical landing pages
          '/search',

          // Internal docs/help — not marketing content
          '/docs',
          '/help',

          // Auth-gated or internal pages not covered by portal prefixes above
          '/mou/employer',        // MOU signing form — requires admin client
          '/parent-portal',       // Auth-gated — redirects to login
          '/certificates/verify', // Redirects to /cert/verify
          '/legal/governance',    // Internal governance docs
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    // Tells crawlers the canonical host for this site
    host: SITE.url,
  };
}
