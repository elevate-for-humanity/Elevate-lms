import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

export type ProvisionTrialWebsiteParams = {
  organizationId: string;
  organizationName: string;
  subdomain: string;
  trialEndsAt: string;
  contactEmail?: string;
  industry?: string;
  websiteMode?: 'new_site' | 'existing_site' | 'api_embed';
  siteConfig?: TenantSiteConfig;
};

export type ProvisionTrialWebsiteResult =
  | { ok: true; websiteId: string; publicUrl: string }
  | { ok: false; error: string };

export async function provisionTrialWebsite(
  params: ProvisionTrialWebsiteParams,
): Promise<ProvisionTrialWebsiteResult> {
  const {
    organizationId,
    organizationName,
    subdomain,
    trialEndsAt,
    contactEmail,
    industry,
    websiteMode = 'new_site',
    siteConfig: overrideConfig,
  } = params;

  const db = await requireAdminClient();
  const slug = subdomain.trim().toLowerCase();
  const config =
    overrideConfig ??
    buildDefaultSiteConfig({
      organizationName,
      industry: industry ?? 'General',
      contactEmail,
    });

  if (websiteMode === 'existing_site') {
    config.homepage.heroCtaText = 'Enroll Now';
    config.homepage.heroSubtitle =
      'Connect your existing website to Elevate enrollment and learner management.';
  }

  const payload: Record<string, unknown> = {
    organization_id: organizationId,
    subdomain: slug,
    site_name: organizationName,
    template_id: config.template.id,
    is_published: true,
    status: 'published',
    site_config: config,
    trial_ends_at: trialEndsAt,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await db
    .from('user_websites')
    .select('id')
    .eq('organization_id', organizationId)
    .maybeSingle();

  try {
    if (existing?.id) {
      const { error } = await db.from('user_websites').update(payload).eq('id', existing.id);
      if (error) throw error;
      return { ok: true, websiteId: existing.id, publicUrl: `https://${slug}.app.elevateforhumanity.org` };
    }

    const { data: inserted, error } = await db
      .from('user_websites')
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select('id')
      .maybeSingle();

    if (error || !inserted?.id) {
      return { ok: false, error: error?.message ?? 'insert returned no row' };
    }

    return {
      ok: true,
      websiteId: inserted.id,
      publicUrl: `https://${slug}.app.elevateforhumanity.org`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[provisionTrialWebsite] failed', err instanceof Error ? err : undefined, {
      organizationId,
    });
    return { ok: false, error: msg };
  }
}
