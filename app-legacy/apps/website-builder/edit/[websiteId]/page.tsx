import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WebsiteEditorClient } from './WebsiteEditorClient';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ websiteId: string }> };

export default async function WebsiteEditorPage({ params }: Props) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/apps/website-builder/edit/${websiteId}`);

  const { data: site } = await supabase
    .from('user_websites')
    .select('id, user_id, site_name, subdomain, is_published, site_config')
    .eq('id', websiteId)
    .maybeSingle();

  if (!site || (site.user_id && site.user_id !== user.id)) notFound();

  const name = (site.site_name as string | null) ?? 'My Site';
  const base = buildDefaultSiteConfig({ organizationName: name });
  const config =
    site.site_config && typeof site.site_config === 'object'
      ? mergeSiteConfig(base, site.site_config as Partial<TenantSiteConfig>)
      : base;

  return (
    <WebsiteEditorClient
      websiteId={site.id}
      siteName={name}
      subdomain={(site.subdomain as string | null) ?? null}
      isPublished={Boolean(site.is_published)}
      initialConfig={config}
    />
  );
}
