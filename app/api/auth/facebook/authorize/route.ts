// PUBLIC ROUTE: OAuth initiation — no auth possible
// AUTH: Intentionally public — no authentication required
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Facebook OAuth Authorization
 * Redirects user to Facebook for authorization
 */
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const clientId = process.env.FACEBOOK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/facebook/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Facebook Client ID not configured' },
      { status: 500 }
    );
  }

  // Facebook OAuth scopes for Pages
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_manage_engagement',
  ];

  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes.join(','));
  authUrl.searchParams.set('response_type', 'code');
  // Use crypto.randomBytes for the OAuth state parameter — Math.random() is
  // predictable and makes CSRF protection ineffective.
  const { randomBytes } = require('crypto') as typeof import('crypto');
  const state = randomBytes(16).toString('hex');
  authUrl.searchParams.set('state', state);

  // Store state in an HttpOnly cookie so the callback can verify it.
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('oauth_state_facebook', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });
  return response;
}
export const GET = withApiAudit('/api/auth/facebook/authorize', _GET);
