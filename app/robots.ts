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
          '/forgot-password',

          // Protected portals
          '/admin/',
          '/lms/',
          '/dashboard/',
          '/student-portal/',
          '/staff-portal/',
          '/partner-portal/',
          '/employer-portal/',
          '/client-portal/',
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
          '/payment/',

          // Internal
          '/demo/',
          '/franchise/admin/',
          '/franchise/office/',
          '/programs/admin/',
          '/pwa/',
          '/shop/dashboard',
          '/shop/checkout',
          '/shop/onboarding',

          // Preview and builder
          '/preview/',
          '/builder/',
          '/studio/',

          // Query-string variants — not canonical, block indexing
          '/programs?*',
          '/search?*',

          // Filter/search pages — thin, not canonical landing pages
          '/search',

          // Infrastructure and platform pages — not marketing content
          '/platform',
          '/docs',
          '/help',


        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    // Tells crawlers the canonical host for this site
    host: SITE.url,
  };
}
