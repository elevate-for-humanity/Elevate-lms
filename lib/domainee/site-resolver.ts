import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tenantPublicSiteUrl } from '@/lib/tenant/public-site-url';

/**
 * Resolve a website owned by the authenticated user and compute the
 * origin URL Domainee should proxy to (the published tenant subdomain URL).
 * Throws an NextResponse-shaped error via the returned `error` field.
 */
export async function resolveOwnedSite(websiteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }
  const { data: site, error } = await supabase
    .from('user_websites')
    .select('id, user_id, subdomain, site_name, is_published')
    .eq('id', websiteId)
    .maybeSingle();
  if (error) {
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  }
  if (!site || site.user_id !== user.id) {
    return { error: NextResponse.json({ error: 'Website not found' }, { status: 404 }) };
  }
  const originUrl = site.subdomain
    ? tenantPublicSiteUrl(site.subdomain)
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  return { user, supabase, site, originUrl };
}

/** Validate a hostname (RFC 1035-ish, apex or subdomain). */
export function validateHostname(hostname: string): string | null {
  const h = hostname.trim().toLowerCase();
  if (!h || h.length > 253) return null;
  if (!/^[a-z0-9]([a-z0-9-]{0,251}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,251}[a-z0-9])?)+$/.test(h))
    return null;
  return h;
}
