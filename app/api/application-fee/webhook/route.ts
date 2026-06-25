/**
 * Application Fee Webhook Handler
 *
 * Handles payment confirmations for $15 application fees.
 * On checkout.session.completed:
 *   - Marks the application as paid and eligible for review
 *   - Records payment in application_payments table
 *
 * Fee Policy:
 * - Programs: $15 fee required
 * - Host Shops: $15 fee required
 * - Apprenticeships: $0 NO FEE (no checkout created)
 *
 * Stripe Dashboard:
 * https://dashboard.stripe.com/webhooks/we_1TiEECH4a2yrVOt5ontaDew38
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { constructWebhookEvent } from '@/lib/stripe/construct-webhook-event';
import { getStripe } from '@/lib/stripe/client';
import { 
  APPLICATION_FEE_PRICE_ID, 
  APPLICATION_FEE_AMOUNT_CENTS,
  isHostShopApplication 
} from '@/lib/config/application-fee-config';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ received: true, warning: 'no_signature' }, { status: 200 });
  }

  const stripe = getStripe();
  if (!stripe) {
    logger.error('Application fee webhook: Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(stripe, payload, sig);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Application fee webhook: signature verification failed', undefined, { error: msg });
    return NextResponse.json({ received: true, warning: 'invalid_signature' }, { status: 200 });
  }

  logger.info('Application fee webhook received', { type: event.type, eventId: event.id });

  const supabase = await createClient();
  const adminDb = await requireAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const applicationId = metadata.application_id;
        const programSlug = metadata.program_slug;
        const userId = metadata.user_id || session.customer_details?.email;
        const isHostShop = metadata.is_host_shop === 'true';

        logger.info('Application fee payment completed', {
          sessionId: session.id,
          applicationId,
          programSlug,
          amount: session.amount_total,
          isHostShop,
        });

        // Record the payment in application_payments table
        if (adminDb) {
          const { error: insertError } = await adminDb.from('application_payments').insert({
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
            application_id: applicationId || null,
            program_slug: programSlug || null,
            user_id: userId || null,
            amount_cents: session.amount_total || APPLICATION_FEE_AMOUNT_CENTS,
            status: 'completed',
            paid_at: new Date().toISOString(),
            customer_email: session.customer_details?.email,
            customer_name: session.customer_details?.name,
            payment_type: isHostShop ? 'host_shop_fee' : 'program_fee',
          });

          if (insertError) {
            logger.error('Failed to record application payment', insertError);
          } else {
            logger.info('Application payment recorded successfully', { applicationId, programSlug, isHostShop });
          }
        }

        // Update application status to paid if application_id provided
        if (applicationId && adminDb) {
          const updateData: Record<string, unknown> = {
            application_fee_paid: true,
            application_fee_paid_at: new Date().toISOString(),
            application_fee_session_id: session.id,
          };

          // Set status based on type
          if (isHostShop) {
            updateData.status = 'host_shop_fee_paid';
          } else {
            updateData.status = 'fee_paid';
          }

          const { error: updateError } = await adminDb
            .from('applications')
            .update(updateData)
            .eq('id', applicationId);

          if (updateError) {
            logger.error('Failed to update application status', updateError);
          } else {
            logger.info('Application status updated', { applicationId, status: updateData.status });
          }
        }

        logger.info('Application fee processed successfully', { applicationId, programSlug, isHostShop });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        logger.info('Application fee refunded', { chargeId: charge.id, paymentIntentId });

        if (adminDb && paymentIntentId) {
          // Update payment record
          await adminDb
            .from('application_payments')
            .update({
              status: 'refunded',
              refunded_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent', paymentIntentId);

          // Mark application as refundable
          const { data: payment } = await adminDb
            .from('application_payments')
            .select('application_id')
            .eq('stripe_payment_intent', paymentIntentId)
            .maybeSingle();

          if (payment?.application_id) {
            await adminDb
              .from('applications')
              .update({
                application_fee_paid: false,
                application_fee_paid_at: null,
                application_fee_session_id: null,
                status: 'refunded',
              })
              .eq('id', payment.application_id);
          }
        }
        break;
      }

      default:
        logger.debug('Unhandled application fee event', { type: event.type });
    }
  } catch (err) {
    logger.error('Error processing application fee webhook', err as Error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export const POST = _POST;