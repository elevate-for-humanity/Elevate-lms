// PUBLIC ROUTE: OAuth initiation — no auth possible before redirect
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Twitter/X OAuth 2.0 PKCE Authorization
 * Redirects admin to Twitter for authorization.
 * Uses OAuth 2.0 with PKCE (required for Twitter API v2).
 */
async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const clientId = process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY;
  if (!clientId) {
    return NextResponse.json({ error: 'Twitter Client ID not configured' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/twitter/callback`;

  // PKCE code verifier + challenge
  const codeVerifier = randomBytes(32).toString('base64url');
  const { createHash } = await import('crypto');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

  const state = randomBytes(16).toString('hex');

  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authUrl.toString());
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  };
  response.cookies.set('oauth_state_twitter', state, cookieOpts);
  response.cookies.set('oauth_pkce_twitter', codeVerifier, cookieOpts);
  return response;
}

export const GET = withApiAudit('/api/auth/twitter/authorize', _GET);
