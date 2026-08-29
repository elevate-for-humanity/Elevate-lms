import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'Facebook application is not configured' }, { status: 503 });

  const origin = getPublicAdminOrigin(request);
  const redirectUri = `${origin}/api/auth/facebook/callback`;
  const state = randomBytes(24).toString('hex');
  const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v26.0';
  const authUrl = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set(
    'scope',
    'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
  );
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('oauth_state_facebook', state, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/',
  });
  return response;
}
