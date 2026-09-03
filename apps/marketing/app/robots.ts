import type { MetadataRoute } from 'next';
import {
  PRIVATE_ROUTE_PREFIXES,
  PUBLIC_SITE_ORIGIN,
} from '@/lib/navigation/public-route-registry';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...PRIVATE_ROUTE_PREFIXES],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: [...PRIVATE_ROUTE_PREFIXES],
      },
    ],
    sitemap: `${PUBLIC_SITE_ORIGIN}/sitemap.xml`,
    host: PUBLIC_SITE_ORIGIN,
  };
}
