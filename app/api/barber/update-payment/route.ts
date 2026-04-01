/**
 * POST /api/barber/update-payment
 *
 * Creates a Stripe Billing Portal session for a barber apprentice to update
 * their payment method. Returns the portal URL for client-side redirect.
 *
 * Auth: requires authenticated user with a barber_subscriptions record.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  // Auth check
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return safeError('Unauthorized', 401);
  }

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const stripe = getStripe();

  try {
    // Get the user's barber subscription
    const { data: sub, error: subError } = await db
      .from('barber_subscriptions')
      .select('id, stripe_customer_id, payment_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError || !sub) {
      return safeError('No barber subscription found', 404);
    }

    if (!sub.stripe_customer_id) {
      return safeError('No Stripe customer on record', 404);
    }

    // Create Stripe Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${SITE_URL}/billing-required?updated=1`,
    });

    logger.info('[update-payment] Portal session created', { userId: user.id, subId: sub.id });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return safeInternalError(err, 'Failed to create billing portal session');
  }
}
