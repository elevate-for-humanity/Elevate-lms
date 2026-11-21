import type { MetadataRoute } from 'next';

/**
 * Admin is an authenticated operations application, not a public website.
 * A publicly readable robots.txt prevents crawlers from walking private
 * routes; it is not an authorization boundary (RBAC remains authoritative).
 * Do not publish a sitemap of student, staff, or administrator URLs.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      disallow: '/',
    }],
  };
}
