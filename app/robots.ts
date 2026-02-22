import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo/siteMetadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/lms/',
          '/api/',
          '/auth/',
          '/login',
          '/signup',
          '/student-portal/',
          '/staff-portal/',
          '/partner-portal/',
          '/onboarding/',
          '/settings/',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
