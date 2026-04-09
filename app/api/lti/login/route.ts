// AUTH: Intentionally public — LTI 1.3 OIDC login initiation endpoint.
// Generates a state + nonce, stores them in a signed HttpOnly cookie,
// then redirects the platform to the authorization endpoint.

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Cookie name for the LTI state/nonce pair
const LTI_STATE_COOKIE = 'lti_state';
// TTL: 10 minutes — enough for a slow browser redirect
const STATE_TTL_SECONDS = 600;

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const iss          = url.searchParams.get('iss');
  const loginHint    = url.searchParams.get('login_hint');
  const clientId     = url.searchParams.get('client_id');
  const targetLinkUri = url.searchParams.get('target_link_uri');

  if (!iss || !loginHint || !clientId || !targetLinkUri) {
    return NextResponse.json({ error: 'Missing LTI parameters: iss, login_hint, client_id, target_link_uri required' }, { status: 400 });
  }

  // Look up platform to get its authorization endpoint
  const db = await getAdminClient();
  const { data: platform } = await db
    .from('lti_platforms')
    .select('auth_login_url, jwks_uri')
    .eq('issuer', iss)
    .eq('client_id', clientId)
    .maybeSingle();

  if (!platform?.auth_login_url) {
    logger.error(`[LTI login] Unknown platform iss=${iss} client_id=${clientId}`);
    return NextResponse.json({ error: 'Unknown LTI platform' }, { status: 403 });
  }

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  // Build the redirect to the platform's authorization endpoint
  const authUrl = new URL(platform.auth_login_url);
  authUrl.searchParams.set('scope',          'openid');
  authUrl.searchParams.set('response_type',  'id_token');
  authUrl.searchParams.set('response_mode',  'form_post');
  authUrl.searchParams.set('prompt',         'none');
  authUrl.searchParams.set('client_id',      clientId);
  authUrl.searchParams.set('redirect_uri',   `${new URL(request.url).origin}/api/lti/launch`);
  authUrl.searchParams.set('login_hint',     loginHint);
  authUrl.searchParams.set('state',          state);
  authUrl.searchParams.set('nonce',          nonce);
  authUrl.searchParams.set('lti_message_hint', url.searchParams.get('lti_message_hint') ?? '');

  const response = NextResponse.redirect(authUrl.toString());

  // Store state+nonce in a signed HttpOnly cookie so the launch endpoint can verify them.
  // Value: "<state>.<nonce>" — simple, no external store needed.
  response.cookies.set(LTI_STATE_COOKIE, `${state}.${nonce}`, {
    httpOnly: true,
    secure:   true,
    sameSite: 'none',   // required for cross-origin LTI iframe flows
    maxAge:   STATE_TTL_SECONDS,
    path:     '/api/lti',
  });

  return response;
}

export const GET = withApiAudit('/api/lti/login', _GET);
