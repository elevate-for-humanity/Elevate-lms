import type { NextRequest } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { tenantSlugFromAppHost } from '@/lib/tenant/middleware-tenant-routing';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

const RESERVED_ELEVATE_HOSTS = new Set([
  'elevateforhumanity.org',
  'www.elevateforhumanity.org',
  'app.elevateforhumanity.org',
  'admin.elevateforhumanity.org',
  'portal.elevateforhumanity.org',
  'store.elevateforhumanity.org',
  'testing.elevateforhumanity.org',
]);

function requestHost(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  return (forwarded || request.headers.get('host') || '').split(':')[0].toLowerCase();
}

export type ResolvedPublicTenant = {
  websiteId: string;
  ownerUserId: string | null;
  subdomain: string | null;
  host: string;
};

async function ownerCanServeWebsite(db: Awaited<ReturnType<typeof requireAdminClient>>, ownerUserId: string | null) {
  // Legacy organization-owned sites without a user owner continue through the
  // organization path. User-owned Website Builder sites require a current paid
  // subscription or unexpired trial every time the public host is resolved.
  if (!ownerUserId) return true;
  const access = await getWebsiteBuilderAccess(ownerUserId, db);
  return access.allowed;
}

/** Resolve only a currently published Website Builder tenant with active access. */
export async function resolvePublishedTenantFromRequest(
  request: NextRequest,
): Promise<ResolvedPublicTenant | null> {
  const host = requestHost(request);
  if (!host) return null;
  const db = await requireAdminClient();

  const slug = tenantSlugFromAppHost(host);
  if (slug) {
    const { data } = await db
      .from('user_websites')
      .select('id, user_id, subdomain')
      .eq('subdomain', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (!data) return null;
    if (!(await ownerCanServeWebsite(db, data.user_id ?? null))) return null;
    return { websiteId: data.id, ownerUserId: data.user_id ?? null, subdomain: data.subdomain, host };
  }

  if (RESERVED_ELEVATE_HOSTS.has(host) || host.endsWith('.elevateforhumanity.org')) {
    return null;
  }

  const { data: domain } = await db
    .from('website_domains')
    .select('website_id')
    .ilike('hostname', host)
    .eq('status', 'active')
    .maybeSingle();
  if (!domain?.website_id) return null;

  const { data: website } = await db
    .from('user_websites')
    .select('id, user_id, subdomain')
    .eq('id', domain.website_id)
    .eq('is_published', true)
    .maybeSingle();
  if (!website) return null;
  if (!(await ownerCanServeWebsite(db, website.user_id ?? null))) return null;
  return { websiteId: website.id, ownerUserId: website.user_id ?? null, subdomain: website.subdomain, host };
}
