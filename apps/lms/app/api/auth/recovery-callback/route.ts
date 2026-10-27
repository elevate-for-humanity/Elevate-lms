import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { siteUrls } from '@/lib/utils/site-urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * First-party Supabase recovery callback.
 *
 * Verify the one-time recovery token here, persist the session in secure
 * cookies, and redirect to the new-password form. Legacy PKCE links remain
 * supported so previously issued links fail gracefully.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const code = requestUrl.searchParams.get('code');
  const next = validateRedirect(
    requestUrl.searchParams.get('next'),
    '/reset-password?mode=recovery',
  );
  const supabase = await createClient();

  let error: Error | null = null;

  if (tokenHash) {
    const result = await supabase.auth.verifyOtp({
      type: 'recovery',
      token_hash: tokenHash,
    });
    error = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else {
    return NextResponse.redirect(
      new URL('/login?error=missing_recovery_token', siteUrls.app),
    );
  }

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=recovery_failed', siteUrls.app),
    );
  }

  return NextResponse.redirect(new URL(next, siteUrls.app));
}
