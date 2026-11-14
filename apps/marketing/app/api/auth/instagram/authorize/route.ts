// PUBLIC ROUTE: OAuth initiation — no auth possible before redirect
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Instagram OAuth Authorization (via Facebook Graph API)
 * Requires instagram_basic, instagram_content_publish, pages_show_list scopes.
 * Uses the same Facebook App as the Facebook OAuth flow.
 */
async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Facebook/Instagram Client ID not configured' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/instagram/callback`;
  const state = randomBytes(16).toString('hex');

  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
  ];

  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes.join(','));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('oauth_state_instagram', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });
  return response;
}

export const GET = withApiAudit('/api/auth/instagram/authorize', _GET);
