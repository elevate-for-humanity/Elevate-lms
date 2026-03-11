import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

        // Link any pre-payment program_enrollments rows (user paid before
        // creating an account — email matches, user_id is null).
        try {
          const db = createAdminClient();
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
              console.error('[auth/confirm] enrollment lookup failed', {
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
                  console.error('[auth/confirm] enrollment link failed', {
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
                    console.error('[auth/confirm] barber_subscriptions link failed', {
                      barberSubId: row.barber_sub_id,
                      userId: user.id,
                      error: subError.message,
                    });
                  } else {
                    subLinkedCount++;
                  }
                }
              }

              console.info('[auth/confirm] enrollment linking complete', {
                userId: user.id,
                pendingCount,
                linkedCount,
                subLinkedCount,
              });

              // If the user has a pending enrollment and landed on the default
              // dashboard redirect, send them to their program's enrollment-success
              // page instead. Driven by program_slug so this works for future programs.
              if (redirectTo === '/lms/dashboard?verified=true') {
                const firstSlug = unlinked!.find(r => r.program_slug)?.program_slug;
                if (firstSlug) {
                  redirectTo = `/programs/${firstSlug}/enrollment-success`;
                }
              }
            } else {
              console.info('[auth/confirm] no pending enrollments to link', { userId: user.id });
            }
          }
        } catch (err: any) {
          // Non-fatal — enrollment-success page has its own email-linking fallback
          console.error('[auth/confirm] enrollment linking threw', { error: err?.message });
        }
      } else if (type === 'recovery') {
        // Use the next param set by sendRecoveryEmail's redirectTo option.
        // Fall back to /auth/reset-password if next wasn't passed or was stripped.
        // `next` is already validated by validateRedirect() above — it only accepts
        // same-origin paths (must start with /, no protocol-relative or external URLs).
        redirectTo = next !== '/' ? next : '/auth/reset-password';
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
