import { requireAdminClient } from '@/lib/supabase/admin';
import type { PublishedTenantSite, TenantSiteConfig } from '@/lib/tenant/site-types';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

type WebsiteRow = {
  id: string;
  user_id: string | null;
  subdomain: string | null;
  site_name: string | null;
  organization_id: string | null;
  site_config: unknown;
  is_published: boolean | null;
};

function parseConfig(raw: unknown, fallbackName: string): TenantSiteConfig {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const cfg = raw as TenantSiteConfig;
    if (cfg.homepage?.heroTitle && cfg.branding?.primaryColor) {
      return ensureComposableSiteConfig(cfg);
    }
  }
  return ensureComposableSiteConfig(buildDefaultSiteConfig({ organizationName: fallbackName }));
}

async function userOwnedSiteCanServe(db: Awaited<ReturnType<typeof requireAdminClient>>, userId: string | null) {
  if (!userId) return true;
  const access = await getWebsiteBuilderAccess(userId, db);
  return access.allowed;
}

export async function loadPublishedSiteBySubdomain(
  subdomain: string,
): Promise<PublishedTenantSite | null> {
  const db = await requireAdminClient();
  const slug = subdomain.trim().toLowerCase();
  if (!slug) return null;

  const { data: site, error } = await db
    .from('user_websites')
    .select('id, user_id, subdomain, site_name, organization_id, site_config, is_published')
    .eq('subdomain', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (!error && site) {
    const row = site as WebsiteRow;
    if (!(await userOwnedSiteCanServe(db, row.user_id))) return null;
    return {
      id: row.id,
      subdomain: row.subdomain ?? slug,
      siteName: row.site_name ?? slug,
      organizationId: row.organization_id,
      config: parseConfig(row.site_config, row.site_name ?? slug),
    };
  }

  const { data: org } = await db
    .from('organizations')
    .select('id, name, slug, status')
    .eq('slug', slug)
    .maybeSingle();

  if (!org || org.status === 'trial_expired' || org.status === 'archived') return null;

  const { data: orgSite } = await db
    .from('user_websites')
    .select('id, user_id, subdomain, site_name, organization_id, site_config, is_published')
    .eq('organization_id', org.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orgSite) {
    const row = orgSite as WebsiteRow;
    if (row.is_published) {
      if (!(await userOwnedSiteCanServe(db, row.user_id))) return null;
      return {
        id: row.id,
        subdomain: row.subdomain ?? slug,
        siteName: row.site_name ?? org.name,
        organizationId: org.id,
        config: parseConfig(row.site_config, org.name),
      };
    }
  }

  return {
    id: `org-${org.id}`,
    subdomain: slug,
    siteName: org.name,
    organizationId: org.id,
    config: ensureComposableSiteConfig(buildDefaultSiteConfig({ organizationName: org.name })),
  };
}
