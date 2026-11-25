/**
 * Barber apprenticeship suspension helpers.
 *
 * SUSPENSION POLICY (locked — do not change without updating all email copy):
 *   Full login denial for non-payment — no exemptions.
 *
 *   BLOCKED when suspended:
 *     - LMS login entirely. The admin "suspend user" action sets
 *       profiles.suspended = true and profiles.is_active = false, which the
 *       LMS guards read (lib/auth/require-user.ts, require-role.ts,
 *       require-api-role.ts, auth.ts). A suspended student is redirected to
 *       /unauthorized or /billing-required and cannot reach coursework,
 *       videos, quizzes, the dashboard, or the PWA.
 *     - Clock in / time tracking  (timeclock/action, timeclock/heartbeat)
 *     - Hour logging API          (pwa/barber/log-hours)
 *     - PWA dashboard             (pwa/barber layout)
 *
 *   ALLOWED when suspended:
 *     - /billing-required itself (billing-exempt) and the /billing page, so
 *       the student can see what is owed and pay to restore access.
 *     - Public program pages
 *
 *   This replaced the old partial-suspension policy (hour logging blocked,
 *   LMS coursework allowed). Coursework is no longer available while
 *   suspended.
 *
 *   The hour-logging gate below (checkBarberSuspension, 402) is unchanged:
 *   it still blocks timeclock/hour writes for suspended or past-due-beyond-
 *   grace accounts on the legacy barber_subscriptions record.
 *
 *   Email copy: the two locations previously named here no longer send a
 *   suspension email — the barber webhook is retired (503/410) and the
 *   barber-billing cron is review-only. No live email copy in the repo
 *   states the old partial-suspension policy (verified 2026-11-25). Any
 *   suspension or payment-denial notice must state full login denial, no
 *   exemptions, and point the student at /billing-required to pay.
 *
 * checkBarberSuspension — looks up the user's barber_subscriptions row and
 * returns a 402 NextResponse if the account is suspended or past_due beyond
 * the grace period. Returns null when the account is in good standing.
 *
 * Usage in API routes:
 *   const suspended = await checkBarberSuspension(userId, db);
 *   if (suspended) return suspended;
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@/lib/supabase';

const BILLING_REQUIRED_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/billing-required`
  : '/billing-required';

export async function checkBarberSuspension(
  userId: string,
  db: SupabaseClient,
): Promise<NextResponse | null> {
  const { data: sub } = await db
    .from('barber_subscriptions')
    .select('payment_status, suspension_deadline, billing_exception_until')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // No subscription record — not a barber apprentice, allow through
  if (!sub) return null;

  const status = sub.payment_status as string | null;
  const exceptionUntil = sub.billing_exception_until
    ? new Date(sub.billing_exception_until as string)
    : null;

  // Sponsor-approved temporary billing exceptions preserve clock/hour access
  // only through the recorded expiration. After expiration, normal enforcement applies.
  if (exceptionUntil && exceptionUntil >= new Date()) return null;

  if (status === 'suspended') {
    return NextResponse.json(
      { error: 'Account suspended — payment required', billing_url: BILLING_REQUIRED_URL },
      { status: 402 },
    );
  }

  // past_due AND grace period has expired → treat as suspended
  if (status === 'past_due' && sub.suspension_deadline) {
    const deadline = new Date(sub.suspension_deadline);
    if (deadline < new Date()) {
      return NextResponse.json(
        { error: 'Account suspended — payment required', billing_url: BILLING_REQUIRED_URL },
        { status: 402 },
      );
    }
  }

  return null;
}
