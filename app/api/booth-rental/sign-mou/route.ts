// PUBLIC ROUTE: booth rental MOU signing — public form
/**
 * POST /api/booth-rental/sign-mou
 *
 * Records the signed booth rental agreement after Stripe checkout completes.
 * Stores the signature, printed name, and Stripe session ID in booth_rental_agreements.
 * Activates the booth_rental_subscriptions row so staff can see the renter as active.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { discipline, session_id, printed_name, signature_data_url, signed_at } = body;

    if (!discipline || !session_id || !printed_name || !signature_data_url) {
      return safeError('Missing required fields', 400);
    }

    const stripe = getStripe();
    if (!stripe) return safeError('Payment system unavailable', 503);

    // Verify the Stripe session is paid
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return safeError('Payment not confirmed. Please complete checkout first.', 402);
    }

    const db = await getAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const renterEmail = session.metadata?.renter_email ?? session.customer_details?.email ?? '';
    const renterName = session.metadata?.renter_name ?? printed_name;
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? '';
    const stripeSubscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as any)?.id ?? '';

    // Upsert booth_rental_subscriptions row
    const { error: subError } = await db
      .from('booth_rental_subscriptions')
      .upsert({
        stripe_session_id: session_id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        discipline,
        renter_name: renterName,
        renter_email: renterEmail,
        payment_status: 'active',
        mou_signed: true,
        mou_signed_at: signed_at,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_session_id' });

    if (subError) {
      logger.error('[booth-rental/sign-mou] subscription upsert error', subError);
      // Non-fatal — still record the agreement
    }

    // Record the signed agreement
    const { error: mouError } = await db
      .from('booth_rental_agreements')
      .insert({
        stripe_session_id: session_id,
        stripe_customer_id: stripeCustomerId,
        discipline,
        renter_name: renterName,
        renter_email: renterEmail,
        printed_name,
        signature_data_url,
        signed_at,
        ip_address: request.headers.get('x-forwarded-for') ?? '',
      });

    if (mouError) {
      logger.error('[booth-rental/sign-mou] agreement insert error', mouError);
      return safeError('Failed to record agreement. Please contact us.', 500);
    }

    logger.info('[booth-rental/sign-mou] Agreement signed', { discipline, renter_email: renterEmail });

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to record agreement');
  }
}
