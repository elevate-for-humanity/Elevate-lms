import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function adminOrigin(request: NextRequest): string {
  const configured = process.env.ADMIN_APP_URL?.trim() || process.env.NEXT_PUBLIC_ADMIN_URL?.trim();
  return configured ? new URL(configured).origin : request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'auth');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  await hydrateProcessEnv();
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/settings/social-media?error=google_business_not_configured', adminOrigin(request)));
  }
  const state = randomBytes(24).toString('hex');
  const callback = `${adminOrigin(request)}/api/auth/google-business/callback`;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email https://www.googleapis.com/auth/business.manage');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  const response = NextResponse.redirect(url);
  response.cookies.set('oauth_state_google_business', state, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 1200, path: '/',
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
