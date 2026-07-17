// PUBLIC ROUTE: OAuth initiation — rate-limited; Supabase handles token exchange at /auth/callback
/**
 * GET /api/auth/google/callback
 *
 * Initiates Google OAuth via Supabase signInWithOAuth.
 * Supabase handles the PKCE exchange — the provider redirects back to
 * /auth/callback which exchanges the code and routes by role.
 *
 * Active only when GOOGLE_OAUTH_ENABLED=true.
 * Configure in Supabase Dashboard → Authentication → Providers → Google.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'auth');
  if (rateLimited) return rateLimited;

  if (process.env.GOOGLE_OAUTH_ENABLED !== 'true') {
    return NextResponse.redirect(
      new URL('/login?error=google_sso_disabled', req.url),
    );
  }

  const rawNext = req.nextUrl.searchParams.get('next') ?? '';
  const next = validateRedirect(rawNext, '/learner/dashboard');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback?redirect=${encodeURIComponent(next)}`,
      scopes: 'openid email profile',
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL('/login?error=google_oauth_failed', req.url));
  }

  return NextResponse.redirect(data.url);
}
