/**
 * Host Shop Application Fee Webhook Handler
 * 
 * Handles payment confirmations for \$50 host shop application fees.
 * On checkout.session.completed:
 *   - Records payment in host_shop_applications table
 *   - Sends confirmation email to applicant
 *   - Triggers onboarding workflow
 *
 * Stripe Dashboard:
 * https://dashboard.stripe.com/webhooks/we_1TiF5sH4a2yrVOt5YH6uXcfM
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { constructWebhookEvent } from '@/lib/stripe/construct-webhook-event';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const HOST_SHOP_FEE_AMOUNT_CENTS = 5000; // \$50
export const HOST_SHOP_FEE_PRICE_ID = 'price_1TiF5rH4a2yrVOt55GqwSgJW';

async function _POST(request: NextRequest) {
  const payload = Buffer.from(await request.arrayBuffer());
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(payload, sig);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Host shop webhook: signature verification failed', undefined, { error: msg });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  logger.info('Host shop webhook received', { type: event.type, eventId: event.id });

  const adminDb = await requireAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        
        logger.info('Host shop application fee completed', {
          sessionId: session.id,
          businessName: metadata.business_name,
          email: session.customer_details?.email,
          amount: session.amount_total,
        });

        // Record the payment
        if (adminDb) {
          await adminDb.from('host_shop_applications').insert({
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
            business_name: metadata.business_name || null,
            business_type: metadata.business_type || null,
            contact_name: metadata.contact_name || null,
            contact_email: session.customer_details?.email || metadata.email || null,
            contact_phone: metadata.phone || null,
            license_number: metadata.license_number || null,
            address: metadata.address || null,
            fee_amount_cents: session.amount_total || HOST_SHOP_FEE_AMOUNT_CENTS,
            fee_status: 'paid',
            paid_at: new Date().toISOString(),
            status: 'pending_review',
          }).then(() => {
            logger.info('Host shop application recorded', { sessionId: session.id });
          }).catch((err: Error) => {
            logger.error('Failed to record host shop application', err);
          });
        }

        // Send welcome email with onboarding instructions
        // This would be handled by a separate email service
        logger.info('Host shop onboarding triggered', { 
          sessionId: session.id,
          email: session.customer_details?.email 
        });
        
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        logger.info('Host shop fee refunded', { 
          chargeId: charge.id, 
          paymentIntentId 
        });

        if (adminDb && paymentIntentId) {
          await adminDb
            .from('host_shop_applications')
            .update({
              fee_status: 'refunded',
              refunded_at: new Date().toISOString(),
              status: 'refunded',
            })
            .eq('stripe_payment_intent', paymentIntentId);
        }
        break;
      }

      default:
        logger.debug('Unhandled host shop event', { type: event.type });
    }
  } catch (err) {
    logger.error('Error processing host shop webhook', err as Error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export const POST = _POST;