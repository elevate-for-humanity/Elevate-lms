import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { validateRedirect } from '@/lib/auth/validate-redirect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = validateRedirect(requestUrl.searchParams.get('next'), '/lms/dashboard');

  // Handle OAuth errors from Supabase
  if (error) {
    const errorMessage = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(
      new URL(`/login?error=${errorMessage}`, requestUrl.origin)
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Auth callback error:', exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        );
      }

      // Claim any pre-auth applications
      try {
        await supabase.rpc('claim_applications_for_current_user');
      } catch (claimError) {
        // Don't block redirect if claim fails
        logger.warn('Failed to claim applications:', claimError);
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (err) {
      console.error('Auth callback exception:', err);
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', requestUrl.origin)
      );
    }
  }

  // No code provided
  return NextResponse.redirect(
    new URL('/login?error=no_code', requestUrl.origin)
  );
}
