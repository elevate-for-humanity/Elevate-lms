import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { TenantAnalytics } from '@/components/tenant/TenantSiteClientOps';
import { loadPublishedSiteBySubdomain } from '@/lib/tenant/load-published-site';
import { ensureComposableSiteConfig, normalizePageSlug } from '@/lib/tenant/site-composition';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ subdomain: string; slug?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain, slug: segments } = await params;
  const site = await loadPublishedSiteBySubdomain(subdomain);
  if (!site) return { title: 'Site not found' };
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

export default async function PublicWebsiteBuilderSite({ params }: Props) {
  const { subdomain, slug: segments } = await params;
  const site = await loadPublishedSiteBySubdomain(subdomain);
  if (!site) notFound();
  const normalizedPath = normalizePageSlug('/' + (segments?.join('/') ?? ''));
  const config = ensureComposableSiteConfig(site.config);
  if (!config.pages?.some((page) => page.slug === normalizedPath)) notFound();

  return (
    <>
      <TenantAnalytics pathname={normalizedPath} />
      <PublicTenantComposableSite site={{ ...site, config }} pathname={normalizedPath} basePath={`/sites/${subdomain}`} />
    </>
  );
}
