import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WebsiteLifecyclePanel } from '@/components/website-builder/WebsiteLifecyclePanel';
import { WebsiteAdvancedSettings } from '@/components/website-builder/WebsiteAdvancedSettings';
import { AutonomousWebsiteBuilder } from '@/components/website-builder/AutonomousWebsiteBuilder';
import { ZeroCodeStructureEditor } from '@/components/website-builder/ZeroCodeStructureEditor';
import { DomainPanel } from '@/components/website-builder/DomainPanel';
import { BusinessCardsPanel } from '@/components/website-builder/BusinessCardsPanel';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
import { WebsiteClaimsPanel } from '@/components/website-builder/WebsiteClaimsPanel';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ websiteId: string }> };

export default async function WebsiteEditorPage({ params }: Props) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/apps/website-builder/edit/${websiteId}`);

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed) redirect(access.upgradeUrl || `/store/apps/website-builder?reason=${encodeURIComponent(access.reason || 'inactive')}`);

  const { data: site } = await supabase
    .from('user_websites')
    .select('id, user_id, site_name, subdomain, is_published, site_config')
    .eq('id', websiteId)
    .maybeSingle();

  if (!site || site.user_id !== user.id) notFound();

  const name = (site.site_name as string | null) ?? 'My Site';
  const base = buildDefaultSiteConfig({ organizationName: name });
  const config = ensureComposableSiteConfig(
    site.site_config && typeof site.site_config === 'object'
      ? mergeSiteConfig(base, site.site_config as Partial<TenantSiteConfig>)
      : base,
  );

  return (
    <>
      <WebsiteLifecyclePanel websiteId={site.id} isPublished={Boolean(site.is_published)} />
      <ZeroCodeStructureEditor websiteId={site.id} initialConfig={config} />
      <AutonomousWebsiteBuilder
        websiteId={site.id}
        initialSiteName={name}
        initialSubdomain={(site.subdomain as string | null) ?? null}
        initiallyPublished={Boolean(site.is_published)}
        initialConfig={config}
      />
      <BusinessCardsPanel websiteId={site.id} />
      <WebsiteClaimsPanel websiteId={site.id} />
      <DomainPanel websiteId={site.id} isPublished={Boolean(site.is_published)} />
      <WebsiteAdvancedSettings websiteId={site.id} initialConfig={config} />
    </>
  );
}
