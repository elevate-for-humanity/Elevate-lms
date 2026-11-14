import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { TenantAnalytics } from '@/components/tenant/TenantSiteClientOps';
import { getTenantSlugFromHeaders } from '@/lib/tenant/get-tenant-slug';
import { loadPublishedSiteBySubdomain } from '@/lib/tenant/load-published-site';
import { ensureComposableSiteConfig, normalizePageSlug } from '@/lib/tenant/site-composition';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tenantSlug = await getTenantSlugFromHeaders();
  if (!tenantSlug) return { title: 'Site' };
  const site = await loadPublishedSiteBySubdomain(tenantSlug);
  if (!site) return { title: 'Site not found' };
  const { slug: segments } = await params;
  const path = normalizePageSlug('/' + (segments?.join('/') ?? ''));
  const config = ensureComposableSiteConfig(site.config);
  const page = config.pages?.find((candidate) => candidate.slug === path);
  const title = page?.seo?.title || (path === '/' ? config.seo?.title : page?.title) || site.siteName;
  const description = page?.seo?.description || config.seo?.description;
  const hero = page?.sections.find((section) => section.type === 'hero');
  const heroImage = typeof hero?.content.image === 'string' ? hero.content.image : config.homepage.heroImage;
  return {
    title,
    description,
    keywords: page?.seo?.keywords?.length ? page.seo.keywords : config.seo?.keywords,
    robots: { index: true, follow: true },
    openGraph: { title, description, type: 'website', images: heroImage ? [{ url: heroImage }] : undefined },
  };
}

export default async function TenantSitePage({ params }: Props) {
  const tenantSlug = await getTenantSlugFromHeaders();
  if (!tenantSlug) notFound();
  const site = await loadPublishedSiteBySubdomain(tenantSlug);
  if (!site) notFound();
  const { slug: segments } = await params;
  const normalizedPath = normalizePageSlug('/' + (segments?.join('/') ?? ''));
  const config = ensureComposableSiteConfig(site.config);
  if (!config.pages?.some((page) => page.slug === normalizedPath)) notFound();

  return (
    <>
      <TenantAnalytics pathname={normalizedPath} />
      <PublicTenantComposableSite site={{ ...site, config }} pathname={normalizedPath} />
    </>
  );
}
