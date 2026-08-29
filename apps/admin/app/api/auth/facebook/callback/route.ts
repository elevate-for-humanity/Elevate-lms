import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MetaPage = { id?: string; name?: string; access_token?: string };

function settingsRedirect(request: NextRequest, key: 'success' | 'error', value: string) {
  return NextResponse.redirect(new URL(`/settings/social-media?${key}=${encodeURIComponent(value)}`, request.nextUrl.origin));
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const returnedState = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get('oauth_state_facebook')?.value;
  if (!returnedState || !storedState || returnedState !== storedState) return settingsRedirect(request, 'error', 'invalid_state');
  if (request.nextUrl.searchParams.get('error')) return settingsRedirect(request, 'error', 'authorization_declined');

  const code = request.nextUrl.searchParams.get('code');
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) return settingsRedirect(request, 'error', 'facebook_not_configured');

  const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v26.0';
  const redirectUri = `${request.nextUrl.origin}/api/auth/facebook/callback`;
  const tokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('code', code);

  const tokenResponse = await fetch(tokenUrl);
  const tokenPayload = await tokenResponse.json().catch(() => ({})) as { access_token?: string; expires_in?: number };
  if (!tokenResponse.ok || !tokenPayload.access_token) return settingsRedirect(request, 'error', 'token_exchange_failed');

  const pagesUrl = new URL(`https://graph.facebook.com/${version}/me/accounts`);
  pagesUrl.searchParams.set('fields', 'id,name,access_token');
  pagesUrl.searchParams.set('access_token', tokenPayload.access_token);
  const pagesResponse = await fetch(pagesUrl);
  const pagesPayload = await pagesResponse.json().catch(() => ({})) as { data?: MetaPage[] };
  if (!pagesResponse.ok || !Array.isArray(pagesPayload.data)) return settingsRedirect(request, 'error', 'page_lookup_failed');

  const configuredPageId = process.env.FACEBOOK_PAGE_ID?.trim();
  const page = configuredPageId
    ? pagesPayload.data.find((candidate) => candidate.id === configuredPageId)
    : pagesPayload.data.length === 1 ? pagesPayload.data[0] : undefined;
  if (!page?.id || !page.access_token) return settingsRedirect(request, 'error', configuredPageId ? 'configured_page_not_authorized' : 'page_selection_required');

  const db = await requireAdminClient();
  const expiresAt = tokenPayload.expires_in
    ? new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString()
    : null;
  const { error } = await db.from('social_media_settings').upsert({
    platform: 'facebook', access_token: page.access_token, expires_at: expiresAt,
    organization_id: page.id, profile_data: { id: page.id, name: page.name },
    updated_by: auth.id, updated_at: new Date().toISOString(), enabled: true,
  }, { onConflict: 'platform' });
  if (error) return settingsRedirect(request, 'error', 'connection_save_failed');

  const response = settingsRedirect(request, 'success', 'facebook_connected');
  response.cookies.set('oauth_state_facebook', '', { maxAge: 0, path: '/' });
  return response;
}
