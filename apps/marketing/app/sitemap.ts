import type { MetadataRoute } from 'next';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';
import {
  PUBLIC_ROUTE_REGISTRY,
  PUBLIC_SITE_ORIGIN,
} from '@/lib/navigation/public-route-registry';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTE_REGISTRY.map((route) => ({
    url: `${PUBLIC_SITE_ORIGIN}${route.path === '/' ? '' : route.path}`,
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const hostShopRoutes: MetadataRoute.Sitemap = FEATURED_BEAUTY_HOST_PARTNERS.map((shop) => ({
    url: `${PUBLIC_SITE_ORIGIN}/host-shops/${shop.slug}`,
    lastModified: new Date('2026-08-18T17:35:00-04:00'),
    changeFrequency: 'weekly',
    priority: 0.82,
  }));

  const seen = new Set<string>();
  return [...staticRoutes, ...hostShopRoutes].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
