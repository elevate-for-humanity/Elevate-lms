import { requireAdminClient } from '@/lib/supabase/admin';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { mergeSiteConfig, buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';

export async function saveWebsiteConfig(
  websiteId: string,
  partial: Partial<TenantSiteConfig> & { siteName?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await requireAdminClient();

  const { data: row, error: fetchErr } = await db
    .from('user_websites')
    .select('id, site_name, site_config')
    .eq('id', websiteId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? 'Website not found' };
  }

  const name = (row.site_name as string | null) ?? 'My Site';
  const base = buildDefaultSiteConfig({ organizationName: name });
  const existing =
    row.site_config && typeof row.site_config === 'object'
      ? mergeSiteConfig(base, row.site_config as Partial<TenantSiteConfig>)
      : base;
  const merged = mergeSiteConfig(existing, partial);

  const update: Record<string, unknown> = {
    site_config: merged,
    updated_at: new Date().toISOString(),
  };
  if (partial.siteName) update.site_name = partial.siteName;

  const { error } = await db.from('user_websites').update(update).eq('id', websiteId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
