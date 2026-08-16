import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicTenantSite } from '@/components/tenant/PublicTenantSite';
import { TenantAnalytics, TenantLeadForm } from '@/components/tenant/TenantSiteClientOps';
import { loadPublishedSiteBySubdomain } from '@/lib/tenant/load-published-site';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ subdomain: string; slug?: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const site = await loadPublishedSiteBySubdomain(subdomain);
  if (!site) return { title: 'Site not found' };

  return {
    title: site.config.seo?.title ?? site.siteName,
    description: site.config.seo?.description,
    keywords: site.config.seo?.keywords,
    robots: { index: true, follow: true },
    openGraph: {
      title: site.config.seo?.title ?? site.siteName,
      description: site.config.seo?.description,
      type: 'website',
      images: site.config.homepage.heroImage
        ? [{ url: site.config.homepage.heroImage }]
        : undefined,
    },
  };
}

/**
 * Stable public fallback for Website Builder sites.
 *
 * Wildcard tenant domains remain the preferred branded address, but this route
 * keeps every published site reachable through the production marketing
 * service even when wildcard DNS or hosting bindings are unavailable.
 */
export default async function PublicWebsiteBuilderSite({ params }: Props) {
  const { subdomain, slug: segments } = await params;
  const site = await loadPublishedSiteBySubdomain(subdomain);
  if (!site) notFound();

  const pathname = '/' + (segments?.join('/') ?? '');
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');

  return (
    <>
      <TenantAnalytics pathname={normalizedPath} />
      <PublicTenantSite
        site={site}
        pathname={normalizedPath}
        basePath={`/sites/${subdomain}`}
      />
      {normalizedPath === '/contact' ? (
        <section className="border-t border-slate-200 bg-slate-50 px-5 py-12 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <TenantLeadForm accent={site.config.branding.primaryColor || '#7c3f58'} />
          </div>
        </section>
      ) : null}
    </>
  );
}
