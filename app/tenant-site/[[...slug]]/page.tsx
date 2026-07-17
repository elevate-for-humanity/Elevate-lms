import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicTenantSite } from '@/components/tenant/PublicTenantSite';
import { getTenantSlugFromHeaders } from '@/lib/tenant/get-tenant-slug';
import { loadPublishedSiteBySubdomain } from '@/lib/tenant/load-published-site';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tenantSlug = await getTenantSlugFromHeaders();
  if (!tenantSlug) return { title: 'Site' };
  const site = await loadPublishedSiteBySubdomain(tenantSlug);
  if (!site) return { title: 'Site not found' };
  return {
    title: site.config.seo?.title ?? site.siteName,
    description: site.config.seo?.description,
  };
}

export default async function TenantSitePage({ params }: Props) {
  const tenantSlug = await getTenantSlugFromHeaders();
  if (!tenantSlug) notFound();
  const site = await loadPublishedSiteBySubdomain(tenantSlug);
  if (!site) notFound();
  const { slug: segments } = await params;
  const pathname = '/' + (segments?.join('/') ?? '');
  return <PublicTenantSite site={site} pathname={pathname} />;
}
