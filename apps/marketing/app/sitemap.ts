import type { MetadataRoute } from 'next';
import { PUBLIC_ROUTE_REGISTRY, PUBLIC_SITE_ORIGIN } from '@/lib/navigation/public-route-registry';
import { listPublicHostShops } from '@/lib/partners/public-host-shops';

/**
 * The static route registry is the build-time sitemap authority. Dynamic host
 * shop entries are additive and must never make a production image build depend
 * on SUPABASE_SERVICE_ROLE_KEY. When the privileged client is unavailable at
 * build time, the public static sitemap still emits normally; runtime pages
 * continue to load host-shop data from the database.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTE_REGISTRY.map((route) => ({
    url: `${PUBLIC_SITE_ORIGIN}${route.path === '/' ? '' : route.path}`,
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let hostShopRoutes: MetadataRoute.Sitemap = [];
  try {
    const shops = await listPublicHostShops();
    hostShopRoutes = shops.map((shop) => ({
      url: `${PUBLIC_SITE_ORIGIN}/host-shops/${shop.public_slug}`,
      lastModified: new Date(shop.public_profile_published_at || new Date().toISOString()),
      changeFrequency: 'weekly',
      priority: shop.featured ? 0.86 : 0.82,
    }));
  } catch {
    // Dynamic discovery is optional during image compilation. The canonical
    // static sitemap must remain publishable even when build-time secrets are
    // intentionally unavailable in the Docker stage.
  }

  const seen = new Set<string>();
  return [...staticRoutes, ...hostShopRoutes].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
