// PUBLIC ROUTE: OAuth initiation — no auth possible
// AUTH: Intentionally public — no authentication required
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * YouTube/Google OAuth Authorization
 * Redirects user to Google for authorization
 */
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/youtube/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google Client ID not configured' },
      { status: 500 }
    );
  }

  // Google OAuth scopes for YouTube
  const scopes = [
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube.upload',
  ];

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  // Generate a cryptographically random state value and store it in an
  // HttpOnly cookie so the callback can verify it. Without storing the state
  // server-side, the CSRF check is theater — any attacker-supplied state value
  // would pass because there is nothing to compare it against.
  const { randomBytes } = require('crypto') as typeof import('crypto');
  const state = randomBytes(16).toString('hex');
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('oauth_state_youtube', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes — enough to complete the OAuth flow
    path: '/',
  });
  return response;
}
export const GET = withApiAudit('/api/auth/youtube/authorize', _GET);
