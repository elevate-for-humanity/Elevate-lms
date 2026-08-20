import type { MetadataRoute } from 'next';
import { PUBLIC_ROUTE_REGISTRY, PUBLIC_SITE_ORIGIN } from '@/lib/navigation/public-route-registry';
import { listPublicHostShops } from '@/lib/partners/public-host-shops';
import { STATIC_PROGRAM_MAP } from '@/data/programs';
import { STATIC_POSTS } from '@/content/blog/posts';
import { getDb } from '@/lib/lms/api';

/**
 * Canonical public sitemap authority.
 *
 * The hand-maintained route registry covers stable marketing/legal routes. Public
 * program records and blog posts are additive so Google discovery cannot silently
 * omit valid dynamic content. Private dashboards, authentication routes and APIs
 * are intentionally excluded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTE_REGISTRY.map((route) => ({
    url: `${PUBLIC_SITE_ORIGIN}${route.path === '/' ? '' : route.path}`,
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const programRoutes: MetadataRoute.Sitemap = [...STATIC_PROGRAM_MAP.keys()].map((slug) => ({
    url: `${PUBLIC_SITE_ORIGIN}/programs/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.82,
  }));

  const staticBlogRoutes: MetadataRoute.Sitemap = STATIC_POSTS.filter((post) => post.published).map(
    (post) => ({
      url: `${PUBLIC_SITE_ORIGIN}/blog/${post.slug}`,
      lastModified: new Date(post.published_at),
      changeFrequency: 'monthly',
      priority: 0.68,
    }),
  );

  let databaseBlogRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = await getDb();
    const { data: posts } = await db
      .from('blog_posts')
      .select('slug,published_at,updated_at')
      .eq('published', true)
      .not('slug', 'is', null);

    databaseBlogRoutes = (posts ?? [])
      .filter((post: any) => typeof post.slug === 'string' && post.slug.trim().length > 0)
      .map((post: any) => ({
        url: `${PUBLIC_SITE_ORIGIN}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at || Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.68,
      }));
  } catch {
    // A build without database credentials must still emit the static sitemap.
  }

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
    // static sitemap remains publishable even when privileged secrets are absent.
  }

  const seen = new Set<string>();
  return [
    ...staticRoutes,
    ...programRoutes,
    ...staticBlogRoutes,
    ...databaseBlogRoutes,
    ...hostShopRoutes,
  ].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
