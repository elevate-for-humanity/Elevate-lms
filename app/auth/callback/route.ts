import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getRoleDestination } from '@/lib/auth/role-destinations';
import { validateRedirect } from '@/lib/auth/validate-redirect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = validateRedirect(requestUrl.searchParams.get('next'), '/learner/dashboard');

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
        logger.error('Auth callback error:', exchangeError);
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

      // Resolve role — check user_metadata first (set at signup), then profiles table
      let resolvedRole = 'student';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const allowedRoles = ['student', 'staff', 'partner', 'employer', 'program_holder', 'instructor', 'admin', 'super_admin'];
          const metaRole = user.user_metadata?.role;

          if (metaRole && allowedRoles.includes(metaRole)) {
            // Role was set at signup — use it and write to profile
            resolvedRole = metaRole;
            // Try upsert first, fall back to update — handles both new and existing profiles
            const { error: upsertErr } = await supabase
              .from('profiles')
              .upsert({ id: user.id, role: resolvedRole, email: user.email }, { onConflict: 'id' });
            if (upsertErr) {
              // Profile already exists from trigger — just update the role
              await supabase
                .from('profiles')
                .update({ role: resolvedRole })
                .eq('id', user.id);
            }
          } else {
            // Returning user — read from profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();
            if (profile?.role && allowedRoles.includes(profile.role)) {
              resolvedRole = profile.role;
            }
          }
        }
      } catch (roleErr) {
        logger.warn('Failed to resolve role in callback:', roleErr);
      }

      // Route by role — always, unless an explicit ?next= was provided
      const hasExplicitNext = requestUrl.searchParams.has('next') && next !== '/learner/dashboard';
      if (!hasExplicitNext) {
        const destination = getRoleDestination(resolvedRole);
        return NextResponse.redirect(new URL(destination, requestUrl.origin));
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (err) {
      logger.error('Auth callback exception:', err);
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
