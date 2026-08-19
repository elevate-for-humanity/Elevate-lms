import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
import { ResponsivePreviewClient } from './ResponsivePreviewClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ websiteId: string }> };

export default async function WebsiteResponsivePreviewPage({ params }: Props) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/apps/website-builder/edit/${websiteId}/preview`);

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed) redirect(access.upgradeUrl || `/store/apps/website-builder?reason=${encodeURIComponent(access.reason || 'inactive')}`);

  const { data: site } = await supabase
    .from('user_websites')
    .select('id, user_id, site_name, site_config')
    .eq('id', websiteId)
    .maybeSingle();

  if (!site || (site.user_id && site.user_id !== user.id)) notFound();

  const siteName = (site.site_name as string | null) ?? 'My Site';
  const base = buildDefaultSiteConfig({ organizationName: siteName });
  const config = site.site_config && typeof site.site_config === 'object'
    ? mergeSiteConfig(base, site.site_config as Partial<TenantSiteConfig>)
    : base;

  return <ResponsivePreviewClient websiteId={site.id} siteName={siteName} config={config} />;
}
