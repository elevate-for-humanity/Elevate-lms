import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { tenantPublicSiteUrl } from '@/lib/tenant/public-site-url';
import { syncIndividualAppSubscription } from '@/lib/apps/sync-subscription';

const CUSTOM_DOMAIN_PLANS = new Set(['professional', 'enterprise']);

export interface WebsiteBuilderEntitlement {
  allowed: boolean;
  plan: string | null;
  status: string | null;
}

async function resolveWebsiteBuilderEntitlement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<WebsiteBuilderEntitlement> {
  const synced = await syncIndividualAppSubscription(userId, 'website-builder', supabase).catch(() => null);
  if (!synced) return { allowed: false, plan: null, status: null };

  const plan = String(synced.plan ?? '').toLowerCase();
  const status = String(synced.status ?? '').toLowerCase();
  return {
    allowed: status === 'active' && CUSTOM_DOMAIN_PLANS.has(plan),
    plan: plan || null,
    status: status || null,
  };
}

export async function resolveOwnedSite(websiteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const admin = await requireAdminClient();
  const { data: site, error } = await admin
    .from('user_websites')
    .select('id, user_id, subdomain, site_name, is_published')
    .eq('id', websiteId)
    .maybeSingle();
  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!site || site.user_id !== user.id) {
    return { error: NextResponse.json({ error: 'Website not found' }, { status: 404 }) };
  }

  const originUrl = site.subdomain
    ? tenantPublicSiteUrl(site.subdomain)
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const entitlement = await resolveWebsiteBuilderEntitlement(supabase, user.id);
  return { user, supabase, site, originUrl, entitlement };
}

export function requireCustomDomainEntitlement(entitlement: WebsiteBuilderEntitlement) {
  if (entitlement.allowed) return null;
  return NextResponse.json(
    {
      error: 'Custom domains require an active Website Builder Professional or Enterprise subscription.',
      code: 'UPGRADE_REQUIRED',
      plan: entitlement.plan,
      status: entitlement.status,
      upgradeUrl: '/store/apps/website-builder?reason=subscription-required',
    },
    { status: 403 },
  );
}

export function validateHostname(hostname: string): string | null {
  const h = hostname.trim().toLowerCase();
  if (!h || h.length > 253) return null;
  if (!/^[a-z0-9]([a-z0-9-]{0,251}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,251}[a-z0-9])?)+$/.test(h)) return null;
  return h;
}
