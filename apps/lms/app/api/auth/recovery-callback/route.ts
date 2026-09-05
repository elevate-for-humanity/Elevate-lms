import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { siteUrls } from '@/lib/utils/site-urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dedicated Supabase recovery callback.
 *
 * Keep password recovery on an API route so installed PWAs and stale service
 * workers cannot replace the one-time code exchange with the offline page.
 * Always redirect to the configured public app origin because the container's
 * request URL can expose its internal 0.0.0.0:3000 address.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = validateRedirect(
    requestUrl.searchParams.get('next'),
    '/reset-password?mode=recovery',
  );

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_oauth_code', siteUrls.app),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', siteUrls.app),
    );
  }

  return NextResponse.redirect(new URL(next, siteUrls.app));
}
