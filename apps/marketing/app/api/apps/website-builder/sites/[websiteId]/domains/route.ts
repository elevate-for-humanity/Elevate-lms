// AUTH: Enforced inside handler by resolveOwnedSite(), which requires a Supabase user and ownership of websiteId.
/** List domains attached to an owned Website Builder site. */
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { isDomaineeConfigured } from '@/lib/domainee/client';
import { resolveOwnedSite } from '@/lib/domainee/site-resolver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  await hydrateProcessEnv().catch(() => undefined);
  const { websiteId } = await params;
  const resolved = await resolveOwnedSite(websiteId);
  if ('error' in resolved) return resolved.error;
  const { user, supabase, entitlement } = resolved;

  const { data: domains, error } = await supabase
    .from('website_domains')
    .select('*')
    .eq('website_id', websiteId)
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load domains.' }, { status: 500 });

  return NextResponse.json({
    domains: domains ?? [],
    configured: isDomaineeConfigured(),
    customDomainAllowed: entitlement.allowed,
    plan: entitlement.plan,
    subscriptionStatus: entitlement.status,
    upgradeUrl: '/store/apps/website-builder',
  });
}
