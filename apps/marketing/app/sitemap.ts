import type { MetadataRoute } from 'next';
import { PUBLIC_ROUTE_REGISTRY, PUBLIC_SITE_ORIGIN } from '@/lib/navigation/public-route-registry';
import { getApprovedShops } from '@/lib/programs/host-shops';
import { STATIC_PROGRAM_MAP } from '@/data/programs';
import { STATIC_POSTS } from '@/content/blog/posts';
import { getDb } from '@/lib/lms/api';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';
import { HOST_SHOP_REGIONS } from '@/lib/marketing/host-shop-regions';
import { HVAC_EMPLOYER_REGIONS } from '@/lib/marketing/hvac-employer-regions';
import {
  EMPLOYER_NETWORK_REGIONS,
  EMPLOYER_TALENT_PATHWAYS,
} from '@/lib/marketing/employer-talent-network';

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

  const trustAndBuyerRoutes: MetadataRoute.Sitemap = [
    {
      url: `${PUBLIC_SITE_ORIGIN}/trust`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${PUBLIC_SITE_ORIGIN}/procurement`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${PUBLIC_SITE_ORIGIN}/platform/demo`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  const programRoutes: MetadataRoute.Sitemap = [...STATIC_PROGRAM_MAP.keys()].map((slug) => ({
    url: `${PUBLIC_SITE_ORIGIN}/programs/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.82,
  }));

  // Curated Host Shop profiles must remain discoverable even when the database
  // is unavailable during sitemap generation. The final de-duplication also
  // handles shops that exist in both the curated and approved-record sources.
  const featuredHostShopRoutes: MetadataRoute.Sitemap = FEATURED_BEAUTY_HOST_PARTNERS.map(
    (shop) => ({
      url: `${PUBLIC_SITE_ORIGIN}/host-shops/${shop.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.86,
    }),
  );

  const hostShopRegionRoutes: MetadataRoute.Sitemap = HOST_SHOP_REGIONS.map((region) => ({
    url: `${PUBLIC_SITE_ORIGIN}/partners/host-shops/indiana/${region.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const hvacEmployerRoutes: MetadataRoute.Sitemap = [
    {
      url: `${PUBLIC_SITE_ORIGIN}/employers/hvac-partners`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.86,
    },
    ...HVAC_EMPLOYER_REGIONS.map((region) => ({
      url: `${PUBLIC_SITE_ORIGIN}/employers/hvac-partners/indiana/${region.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.78,
    })),
  ];

  const employerTalentRoutes: MetadataRoute.Sitemap = [
    {
      url: `${PUBLIC_SITE_ORIGIN}/employers/talent-network`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.88,
    },
    ...EMPLOYER_TALENT_PATHWAYS.flatMap((pathway) => [
      {
        url: `${PUBLIC_SITE_ORIGIN}/employers/talent-network/${pathway.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.84,
      },
      ...EMPLOYER_NETWORK_REGIONS.map((region) => ({
        url: `${PUBLIC_SITE_ORIGIN}/employers/talent-network/${pathway.slug}/indiana/${region.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.76,
      })),
    ]),
  ];

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
    const shops = await getApprovedShops();
    hostShopRoutes = shops
      .filter((shop) => Boolean(shop.publicSlug))
      .map((shop) => ({
        url: `${PUBLIC_SITE_ORIGIN}/host-shops/${shop.publicSlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.82,
      }));
  } catch {
    // Dynamic discovery is optional during image compilation.
  }

  const seen = new Set<string>();
  return [
    ...staticRoutes,
    ...trustAndBuyerRoutes,
    ...programRoutes,
    ...featuredHostShopRoutes,
    ...hostShopRegionRoutes,
    ...hvacEmployerRoutes,
    ...employerTalentRoutes,
    ...staticBlogRoutes,
    ...databaseBlogRoutes,
    ...hostShopRoutes,
  ].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
