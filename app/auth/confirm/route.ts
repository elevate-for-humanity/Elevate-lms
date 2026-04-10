import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { logger } from '@/lib/logger';

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
        // Default for learners — may be overridden below based on role
        redirectTo = '/learner/dashboard?verified=true';

        // Link any pre-payment program_enrollments rows (user paid before
        // creating an account — email matches, user_id is null).
        try {
          const db = await getAdminClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email && db) {
            // Normalize email to prevent casing mismatches (User@Email.com vs user@email.com)
            const normalizedEmail = user.email.toLowerCase().trim();

            // ilike handles legacy rows that may have been inserted with mixed casing
            const { data: unlinked, error: fetchError } = await db
              .from('program_enrollments')
              .select('id, barber_sub_id, program_slug')
              .ilike('email', normalizedEmail)
              .is('user_id', null);

            if (fetchError) {
              logger.error('[auth/confirm] enrollment lookup failed', {
                userId: user.id,
                error: fetchError.message,
              });
              // unlinked is null when fetchError is set — skip linking rather than
              // proceeding with a non-null assertion that would throw.
              return;
            }

            const pendingCount = unlinked?.length ?? 0;
            let linkedCount = 0;
            let subLinkedCount = 0;

            if (pendingCount > 0) {
              for (const row of unlinked!) {
                const { error: linkError } = await db
                  .from('program_enrollments')
                  .update({ user_id: user.id })
                  .eq('id', row.id);

                if (linkError) {
                  logger.error('[auth/confirm] enrollment link failed', {
                    enrollmentId: row.id,
                    userId: user.id,
                    error: linkError.message,
                  });
                } else {
                  linkedCount++;
                }

                // Backfill barber_subscriptions.user_id so dashboard queries work
                if (row.barber_sub_id) {
                  const { error: subError } = await db
                    .from('barber_subscriptions')
                    .update({ user_id: user.id })
                    .eq('id', row.barber_sub_id);

                  if (subError) {
                    logger.error('[auth/confirm] barber_subscriptions link failed', {
                      barberSubId: row.barber_sub_id,
                      userId: user.id,
                      error: subError.message,
                    });
                  } else {
                    subLinkedCount++;
                  }
                }
              }

              logger.info('[auth/confirm] enrollment linking complete', {
                userId: user.id,
                pendingCount,
                linkedCount,
                subLinkedCount,
              });

              // If the user has a pending enrollment and landed on the default
              // dashboard redirect, send them to their program's enrollment-success
              // page instead. Driven by program_slug so this works for future programs.
              if (redirectTo === '/learner/dashboard?verified=true') {
                const firstSlug = unlinked!.find(r => r.program_slug)?.program_slug;
                if (firstSlug) {
                  redirectTo = `/programs/${firstSlug}/enrollment-success`;
                }
              }
            } else {
              logger.info('[auth/confirm] no pending enrollments to link', { userId: user.id });
            }

            // Reconcile remaining pre-auth tables (applications, barber_subscriptions).
            // program_enrollments is handled above with barber_sub_id backfill logic.
            // Registry-driven — see lib/pre-auth-tables.ts.
            if (db && user?.email) {
              const { reconcilePreAuthRows } = await import('@/lib/pre-auth-tables');
              await reconcilePreAuthRows(db, user.email).catch((err: unknown) => {
                logger.error('[auth/confirm] pre-auth reconciliation failed', {
                  error: err instanceof Error ? err.message : String(err),
                });
              });
            }
          }
        } catch (err: any) {
          // Non-fatal — enrollment-success page has its own email-linking fallback
          logger.error('[auth/confirm] enrollment linking threw', { error: err?.message });
        }

        // Role-based redirect override — program holders land on onboarding, not learner dashboard.
        // This handles magic links sent by sendProgramHolderWelcomeEmail.
        try {
          const db = await getAdminClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user && db) {
            const { data: profile } = await db
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();
            if (profile?.role === 'program_holder') {
              redirectTo = '/program-holder/onboarding';
            }
          }
        } catch {
          // Non-fatal — fall through to default redirect
        }
      } else if (type === 'recovery') {
        // Use the next param set by sendRecoveryEmail's redirectTo option.
        // Fall back to /auth/reset-password if next wasn't passed or was stripped.
        // `next` is already validated by validateRedirect() above — it only accepts
        // same-origin paths (must start with /, no protocol-relative or external URLs).
        redirectTo = next !== '/' ? next : '/auth/reset-password';
      } else if (type === 'invite') {
        // Invited users must set a password before accessing their portal.
        // /auth/set-password reads their role after password creation and
        // redirects them to the correct dashboard automatically.
        redirectTo = '/auth/set-password';

        // Run the same pre-auth reconciliation as signup so any pending
        // applications or enrollments are linked to the new account.
        try {
          const db = await getAdminClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email && db) {
            const { reconcilePreAuthRows } = await import('@/lib/pre-auth-tables');
            await reconcilePreAuthRows(db, user.email).catch((err: unknown) => {
              logger.error('[auth/confirm] invite pre-auth reconciliation failed', {
                error: err instanceof Error ? err.message : String(err),
              });
            });
          }
        } catch (err: any) {
          logger.error('[auth/confirm] invite reconciliation threw', { error: err?.message });
        }
      }

      // Use NEXT_PUBLIC_SITE_URL if set, otherwise fall back to the origin
      // of the incoming request so deploy-preview links work correctly.
      const CANONICAL = process.env.NEXT_PUBLIC_SITE_URL
        ? process.env.NEXT_PUBLIC_SITE_URL
        : new URL(request.url).origin;
      return NextResponse.redirect(new URL(redirectTo, CANONICAL));
    }

    // verifyOtp failed — token expired or already used
    logger.error('Email verification error:', error);
    const CANONICAL = process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL
      : new URL(request.url).origin;

    if (type === 'recovery') {
      // Send back to forgot-password with a clear message instead of silent login redirect
      return NextResponse.redirect(
        new URL('/auth/forgot-password?error=link_expired', CANONICAL)
      );
    }

    return NextResponse.redirect(
      new URL('/login?error=verification_failed', CANONICAL)
    );
  }

  // No token_hash or type — redirect to login
  const CANONICAL = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : new URL(request.url).origin;
  return NextResponse.redirect(
    new URL('/login?error=no_token', CANONICAL)
  );
}
