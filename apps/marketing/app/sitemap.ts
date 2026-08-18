import type { MetadataRoute } from 'next';
import { PUBLIC_ROUTE_REGISTRY, PUBLIC_SITE_ORIGIN } from '@/lib/navigation/public-route-registry';
import { listPublicHostShops } from '@/lib/partners/public-host-shops';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTE_REGISTRY.map((route) => ({
    url: `${PUBLIC_SITE_ORIGIN}${route.path === '/' ? '' : route.path}`,
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const shops = await listPublicHostShops();
  const hostShopRoutes: MetadataRoute.Sitemap = shops.map((shop) => ({
    url: `${PUBLIC_SITE_ORIGIN}/host-shops/${shop.public_slug}`,
    lastModified: new Date(shop.public_profile_published_at || new Date().toISOString()),
    changeFrequency: 'weekly',
    priority: shop.featured ? 0.86 : 0.82,
  }));

  const seen = new Set<string>();
  return [...staticRoutes, ...hostShopRoutes].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
