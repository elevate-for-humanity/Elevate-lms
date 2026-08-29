import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getPublicAdminOrigin(request: NextRequest) {
  const configuredOrigin = process.env.ADMIN_APP_URL?.trim() || process.env.NEXT_PUBLIC_ADMIN_URL?.trim();
  if (configuredOrigin) return new URL(configuredOrigin).origin;

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : request.nextUrl.protocol.replace(':', ''));

  if (host && !host.startsWith('0.0.0.0') && !host.startsWith('localhost')) {
    return `${protocol}://${host}`;
  }

  return process.env.NODE_ENV === 'production'
    ? 'https://admin.elevateforhumanity.org'
    : request.nextUrl.origin;
}

type MetaPage = {
  id?: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: { id?: string; name?: string; username?: string };
};

type MetaIdentity = { id?: string; name?: string };

function settingsRedirect(request: NextRequest, key: 'success' | 'error', value: string) {
  return NextResponse.redirect(new URL(`/settings/social-media?${key}=${encodeURIComponent(value)}`, getPublicAdminOrigin(request)));
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'auth');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const returnedState = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get('oauth_state_facebook')?.value;
  if (!returnedState || !storedState || returnedState !== storedState) return settingsRedirect(request, 'error', 'invalid_state');
  if (request.nextUrl.searchParams.get('error')) return settingsRedirect(request, 'error', 'authorization_declined');

  const code = request.nextUrl.searchParams.get('code');
  const clientId = process.env.FACEBOOK_CLIENT_ID?.trim();
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET?.trim();
  if (!code || !clientId || !clientSecret) return settingsRedirect(request, 'error', 'facebook_not_configured');

  const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v26.0';
  const redirectUri = `${getPublicAdminOrigin(request)}/api/auth/facebook/callback`;
  const tokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('code', code);

  const tokenResponse = await fetch(tokenUrl);
  const tokenPayload = await tokenResponse.json().catch(() => ({})) as {
    access_token?: string;
    expires_in?: number;
    error?: { code?: number; message?: string; type?: string };
  };
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    const message = tokenPayload.error?.message?.toLowerCase() ?? '';
    const configurationError = message.includes('client secret') || message.includes('client_id');
    console.error('[meta-oauth] Token exchange rejected', {
      status: tokenResponse.status,
      code: tokenPayload.error?.code,
      type: tokenPayload.error?.type,
      configurationError,
    });
    return settingsRedirect(
      request,
      'error',
      configurationError ? 'meta_app_credentials_mismatch' : 'token_exchange_failed',
    );
  }

  const identityUrl = new URL(`https://graph.facebook.com/${version}/me`);
  identityUrl.searchParams.set('fields', 'id,name');
  identityUrl.searchParams.set('access_token', tokenPayload.access_token);
  const identityResponse = await fetch(identityUrl);
  const identity = await identityResponse.json().catch(() => ({})) as MetaIdentity;
  if (!identityResponse.ok || !identity.id) return settingsRedirect(request, 'error', 'identity_lookup_failed');

  const pagesUrl = new URL(`https://graph.facebook.com/${version}/me/accounts`);
  pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account{id,name,username}');
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
  const now = new Date().toISOString();
  const settings: Array<{
    platform: string;
    access_token: string;
    expires_at: string | null;
    organization_id: string;
    profile_data: Record<string, unknown>;
    updated_by: string;
    updated_at: string;
    enabled: boolean;
  }> = [{
    platform: 'facebook', access_token: page.access_token, expires_at: expiresAt,
    organization_id: page.id,
    profile_data: {
      id: page.id, name: page.name,
      authorized_by: { id: identity.id, name: identity.name },
      publishes_to: { id: page.id, name: page.name, type: 'facebook_page' },
    },
    updated_by: auth.id, updated_at: now, enabled: true,
  }];
  if (page.instagram_business_account?.id) {
    settings.push({
      platform: 'instagram', access_token: page.access_token, expires_at: expiresAt,
      organization_id: page.instagram_business_account.id,
      profile_data: {
        ...page.instagram_business_account,
        authorized_by: { id: identity.id, name: identity.name },
        publishes_to: { ...page.instagram_business_account, type: 'instagram_business_account' },
        connected_via: { id: page.id, name: page.name, type: 'facebook_page' },
      },
      updated_by: auth.id, updated_at: now, enabled: true,
    });
  }
  const { error } = await db.from('social_media_settings').upsert(settings, { onConflict: 'platform' });
  if (error) return settingsRedirect(request, 'error', 'connection_save_failed');

  const response = settingsRedirect(request, 'success', 'facebook_connected');
  response.cookies.set('oauth_state_facebook', '', { maxAge: 0, path: '/' });
  return response;
}
