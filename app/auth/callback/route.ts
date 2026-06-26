import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { normalizePostAuthDestination, resolvePostLoginDestination } from '@/lib/auth/role-redirects';
import { readRedirectParam, resolveRedirectLocation, validateRedirect } from '@/lib/auth/validate-redirect';
import { reconcilePreAuthRows } from '@/lib/pre-auth-tables';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const type = requestUrl.searchParams.get('type');
  const redirectParam = readRedirectParam(requestUrl.searchParams);
  const redirectTarget = validateRedirect(redirectParam, '/learner/dashboard');

  // Password reset flow — exchange code then send to reset form
  if (code && type === 'recovery') {
    try {
      const supabase = await createClient();
      const { error: recoveryError } = await supabase.auth.exchangeCodeForSession(code);
      if (recoveryError) {
        // Expired or already-used recovery code — expected user behaviour, not an app error
        logger.warn('[auth/callback] Recovery code exchange failed (expired or reused):', {
          code: recoveryError.code ?? recoveryError.status,
          message: recoveryError.message,
        });
        return NextResponse.redirect(
          new URL('/reset-password?error=link_expired', requestUrl.origin),
        );
      }
      // Preserve ?redirect= so reset-password page can forward the user
      // to onboarding (or any other destination) after they set their password.
      const resetDest = redirectParam
        ? `/auth/reset-password?redirect=${encodeURIComponent(redirectTarget)}`
        : '/auth/reset-password';
      return NextResponse.redirect(new URL(resetDest, requestUrl.origin));
    } catch (err) {
      logger.warn(
        '[auth/callback] Recovery exchange threw:',
        err instanceof Error ? err.message : err,
      );
      return NextResponse.redirect(
        new URL('/reset-password?error=link_expired', requestUrl.origin),
      );
    }
  }

  // Handle OAuth errors from Supabase
  if (error) {
    const errorMessage = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(new URL(`/login?error=${errorMessage}`, requestUrl.origin));
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        logger.error('Auth callback error:', exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin),
        );
      }

      // Claim any pre-auth applications and link orphaned enrollments
      // (enrollments submitted via public form before account creation have no user_id)
      try {
        await supabase.rpc('claim_applications_for_current_user');
      } catch (claimError) {
        logger.warn('Failed to claim applications:', claimError);
      }

      // Reconcile all pre-auth tables (program_enrollments, applications,
      // barber_subscriptions). Registry-driven — see lib/pre-auth-tables.ts.
      try {
        const {
          data: { user: callbackUser },
        } = await supabase.auth.getUser();
        if (callbackUser?.email) {
          await reconcilePreAuthRows(supabase, callbackUser.email);
        }
      } catch (linkError) {
        // Non-fatal — rows can be reconciled manually via scripts/detect-orphaned-rows.sql
        logger.warn('[auth/callback] pre-auth reconciliation failed:', linkError);
      }

      // Resolve role — check user_metadata first (set at signup), then profiles table
      let resolvedRole = 'student';
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // Must match every role in lib/auth/role-destinations.ts
          const allowedRoles = [
            'student',
            'instructor',
            'admin',
            'admin',
            'org_admin',
            'staff',
            'program_holder',
            'delegate',
            'partner',
            'sponsor',
            'employer',
            'mentor',
            'creator',
            'workforce_board',
            'case_manager',
            'provider_admin',
            'grant_client',
          ];
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
              await supabase.from('profiles').update({ role: resolvedRole }).eq('id', user.id);
            }
          } else {
            // Returning user — read from profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle();
            if (profile?.role && allowedRoles.includes(profile.role)) {
              resolvedRole = profile.role;
            }
          }
        }
      } catch (roleErr) {
        logger.warn('Failed to resolve role in callback:', roleErr);
      }

      // Route by role — unless an explicit ?redirect= (or legacy ?next=) was provided.
      const hasExplicitRedirect =
        requestUrl.searchParams.has('redirect') || requestUrl.searchParams.has('next');
      if (!hasExplicitRedirect) {
        const destination = resolvePostLoginDestination(null, resolvedRole);
        return NextResponse.redirect(new URL(destination, requestUrl.origin));
      }

      const destination = normalizePostAuthDestination(redirectTarget, resolvedRole);
      return NextResponse.redirect(resolveRedirectLocation(destination, requestUrl.origin));
    } catch (err) {
      logger.error('Auth callback exception:', err);
      return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
    }
  }

  // No code provided
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
}
