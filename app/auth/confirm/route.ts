import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { validateRedirect } from '@/lib/auth/validate-redirect';

/**
 * GET /auth/confirm
 * 
 * Handles email confirmation links from Supabase.
 * This is the redirect URL for email verification, password reset, etc.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = validateRedirect(searchParams.get('next'), '/');

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Redirect to the specified next URL or default based on type
      let redirectTo = next;
      
      if (type === 'signup' || type === 'email') {
        redirectTo = '/lms/dashboard?verified=true';
      } else if (type === 'recovery') {
        redirectTo = '/auth/reset-password';
      } else if (type === 'invite') {
        redirectTo = '/lms/dashboard?invited=true';
      }

      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // Log error for debugging
    console.error('Email verification error:', error);
  }

  // Redirect to error page if verification fails
  return NextResponse.redirect(
    new URL('/login?error=verification_failed', request.url)
  );
}
