// PUBLIC ROUTE: OAuth initiation — no auth possible
// AUTH: Intentionally public — no authentication required
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * LinkedIn OAuth Authorization Initiator
 * Redirects user to LinkedIn for authorization
 */
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/linkedin/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'LinkedIn Client ID not configured' },
      { status: 500 }
    );
  }

  // Use crypto.randomBytes for the OAuth state parameter — Math.random() is
  // predictable and makes CSRF protection ineffective.
  const { randomBytes } = require('crypto') as typeof import('crypto');
  const state = randomBytes(16).toString('hex');

  // LinkedIn OAuth scopes
  const scopes = [
    'r_liteprofile',
    'r_emailaddress',
    'w_member_social',
    'r_organization_social',
    'w_organization_social',
  ];

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', scopes.join(' '));

  // Store state in an HttpOnly cookie so the callback can verify it.
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('oauth_state_linkedin', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });
  return response;
}
export const GET = withApiAudit('/api/auth/linkedin/authorize', _GET);
