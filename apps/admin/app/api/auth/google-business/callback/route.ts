import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GbpAccount = { name?: string; accountName?: string; type?: string; role?: string };
type GbpLocation = {
  name?: string; title?: string; websiteUri?: string;
  storefrontAddress?: { addressLines?: string[]; locality?: string; administrativeArea?: string; postalCode?: string };
};

function adminOrigin(request: NextRequest): string {
  const configured = process.env.ADMIN_APP_URL?.trim() || process.env.NEXT_PUBLIC_ADMIN_URL?.trim();
  return configured ? new URL(configured).origin : request.nextUrl.origin;
}

function redirect(request: NextRequest, key: 'success' | 'error', value: string) {
  return NextResponse.redirect(new URL(`/settings/social-media?${key}=${encodeURIComponent(value)}`, adminOrigin(request)));
}

async function googleJson<T>(url: URL | string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store', signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`GOOGLE_BUSINESS_API_${response.status}`);
  return response.json() as Promise<T>;
}

function isCanonical(location: GbpLocation): boolean {
  const address = location.storefrontAddress;
  const lines = (address?.addressLines ?? []).join(' ').toLowerCase();
  return location.title?.trim().toLowerCase() === 'elevate for humanity career & technical institute' &&
    lines.includes('120') && lines.includes('market') && address?.locality?.toLowerCase() === 'indianapolis' &&
    address?.administrativeArea?.toUpperCase() === 'IN' && address?.postalCode === '46204';
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'auth');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const returnedState = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get('oauth_state_google_business')?.value;
  if (!returnedState || returnedState !== storedState) return redirect(request, 'error', 'invalid_state');
  if (request.nextUrl.searchParams.get('error')) return redirect(request, 'error', 'authorization_declined');
  await hydrateProcessEnv();
  const code = request.nextUrl.searchParams.get('code');
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!code || !clientId || !clientSecret) return redirect(request, 'error', 'google_business_not_configured');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: `${adminOrigin(request)}/api/auth/google-business/callback`, grant_type: 'authorization_code' }),
    signal: AbortSignal.timeout(15_000),
  });
  const token = await tokenResponse.json().catch(() => ({})) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string };
  if (!tokenResponse.ok || !token.access_token) return redirect(request, 'error', 'google_token_exchange_failed');
  try {
    const accountPayload = await googleJson<{ accounts?: GbpAccount[] }>('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', token.access_token);
    const accounts = accountPayload.accounts ?? [];
    const locations: Array<GbpLocation & { account: string }> = [];
    for (const account of accounts) {
      if (!account.name) continue;
      const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`);
      url.searchParams.set('readMask', 'name,title,storefrontAddress,websiteUri');
      url.searchParams.set('pageSize', '100');
      const payload = await googleJson<{ locations?: GbpLocation[] }>(url, token.access_token);
      locations.push(...(payload.locations ?? []).map((location) => ({ ...location, account: account.name! })));
    }
    const matches = locations.filter(isCanonical);
    const selected = matches.length === 1 ? matches[0] : null;
    const now = new Date().toISOString();
    const db = await requireAdminClient();
    const { error } = await db.rpc('store_social_credentials', {
      p_platform: 'google_business', p_access_token: token.access_token,
      p_refresh_token: token.refresh_token ?? null,
      p_expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
      p_organization_id: selected?.name ?? null, p_organizations: locations,
      p_profile_data: selected ? { ...selected, authorized_by: { user_id: auth.id }, publishes_to: selected } : { authorized_by: { user_id: auth.id } },
      p_updated_by: auth.id, p_enabled: Boolean(selected),
      p_granted_scopes: (token.scope ?? '').split(' ').filter(Boolean),
      p_connection_status: selected ? 'verified_read_only' : 'selection_required',
      p_last_verified_at: now, p_dry_run: true,
    });
    if (error) return redirect(request, 'error', 'google_connection_save_failed');
    const response = redirect(request, selected ? 'success' : 'error', selected ? 'google_business_connected' : 'google_location_selection_required');
    response.cookies.set('oauth_state_google_business', '', { maxAge: 0, path: '/' });
    return response;
  } catch (error) {
    console.error('[google-business-oauth] Read-only discovery failed', { code: error instanceof Error ? error.message : 'unknown' });
    return redirect(request, 'error', 'google_business_api_access_required');
  }
}
