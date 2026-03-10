import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { validateRedirect } from '@/lib/auth/validate-redirect';

/** Map a profile role to its post-verification landing page. */
function dashboardForRole(role: string | null | undefined): string {
  switch (role) {
    case 'staff':        return '/onboarding/staff';
    case 'partner':      return '/partner/onboarding';
    case 'employer':     return '/employer-portal';
    case 'program_holder': return '/program-holder/onboarding';
    case 'instructor':   return '/instructor/dashboard';
    default:             return '/lms/dashboard';
  }
}

/**
 * GET /auth/confirm
 *
 * Handles email confirmation links from Supabase (verification, password reset, invites).
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
      let redirectTo: string;

      if (type === 'recovery') {
        redirectTo = next !== '/' ? next : '/auth/reset-password';
      } else if (type === 'signup' || type === 'email') {
        // Route by role so non-student users land on the right portal.
        const { data: { user } } = await supabase.auth.getUser();
        const metaRole = user?.user_metadata?.role as string | undefined;

        // Prefer the profiles table role; fall back to metadata.
        let role = metaRole;
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile?.role) role = profile.role;
        }

        redirectTo = dashboardForRole(role) + '?verified=true';
      } else if (type === 'invite') {
        const { data: { user } } = await supabase.auth.getUser();
        const metaRole = user?.user_metadata?.role as string | undefined;
        let role = metaRole;
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile?.role) role = profile.role;
        }
        redirectTo = dashboardForRole(role) + '?invited=true';
      } else {
        redirectTo = next;
      }

      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    console.error('Email verification error:', error);
  }

  return NextResponse.redirect(
    new URL('/login?error=verification_failed', request.url)
  );
}
