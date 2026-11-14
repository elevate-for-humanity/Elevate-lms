import { requireAdminClient } from '@/lib/supabase/admin';
import { canManageHostedWebsite } from '@/lib/websites/can-manage-hosted-website';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
import { ResponsivePreviewClient } from './ResponsivePreviewClient';
import { ensureComposableSiteConfig, normalizePageSlug } from '@/lib/tenant/site-composition';
import { loadPublishedOfferings } from '@/lib/tenant/published-offerings';

export const dynamic = 'force-dynamic';
export const metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ websiteId: string }>; searchParams: Promise<{ page?: string; device?: string }> };

export default async function WebsiteResponsivePreviewPage({ params, searchParams }: Props) {
  const { websiteId } = await params;
  const query = await searchParams;
  const pageSlug = normalizePageSlug(query.page || '/');
  const initialDevice = query.device === 'mobile' || query.device === 'tablet' ? query.device : 'desktop';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/apps/website-builder/edit/${websiteId}/preview?page=${encodeURIComponent(pageSlug)}`)}`);

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed) redirect(access.upgradeUrl || `/store/apps/website-builder?reason=${encodeURIComponent(access.reason || 'inactive')}`);

  // Server-owned roles and exact organization membership remain mandatory.
  const admin = await requireAdminClient();
  const { data: site } = await admin
    .from('user_websites')
    .select('id, user_id, site_name, site_config, subdomain, is_published')
    .eq('id', websiteId)
    .maybeSingle();

  if (!site || !(await canManageHostedWebsite(admin, websiteId, user.id))) notFound();

  const siteName = (site.site_name as string | null) ?? 'My Site';
  const base = buildDefaultSiteConfig({ organizationName: siteName });
  const config = site.site_config && typeof site.site_config === 'object'
    ? mergeSiteConfig(base, site.site_config as Partial<TenantSiteConfig>)
    : base;

  const composed = ensureComposableSiteConfig(config);
  if (!composed.pages?.some((page) => page.slug === pageSlug)) notFound();
  const { data: workspace } = await admin.from('website_paris_workspaces').select('enabled').eq('website_id', site.id).maybeSingle();
  return <ResponsivePreviewClient websiteId={site.id} siteName={siteName} config={await loadPublishedOfferings(composed)} pageSlug={pageSlug} parisEnabled={workspace?.enabled === true} initialDevice={initialDevice} />;
}
