/**
 * Barber apprenticeship suspension helpers.
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
import type { SupabaseClient } from '@supabase/supabase-js';

const BILLING_REQUIRED_URL =
  process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/billing-required`
    : '/billing-required';

export async function checkBarberSuspension(
  userId: string,
  db: SupabaseClient,
): Promise<NextResponse | null> {
  const { data: sub } = await db
    .from('barber_subscriptions')
    .select('payment_status, suspension_deadline')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // No subscription record — not a barber apprentice, allow through
  if (!sub) return null;

  const status = sub.payment_status as string | null;

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
