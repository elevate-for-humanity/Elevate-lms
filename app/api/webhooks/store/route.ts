import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_STORE || '';

/**
 * Grant LMS course access to user
 */
async function grantLmsAccess(userId: string, courseSlug: string) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  // Find course by slug
  const { data: course } = await db
    .from('training_courses')
    .select('id')
    .eq('slug', courseSlug)
    .single();

  if (!course) {
    logger.warn('Course not found for enrollment', { courseSlug, userId });
    return false;
  }

  // Create enrollment
  const { error } = await db.from('program_enrollments').upsert({
    user_id: userId,
    course_id: course.id,
    status: 'active',
    enrolled_at: new Date().toISOString(),
    source: 'store_purchase',
  }, {
    onConflict: 'user_id,course_id',
  });

  if (error) {
    logger.error('Failed to create enrollment', { error, userId, courseSlug });
    return false;
  }

  return true;
}

/**
 * Unlock digital download for user
 */
async function unlockDownload(userId: string, productId: string, stripePaymentId?: string) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  const { error } = await db.from('user_entitlements').upsert({
    user_id: userId,
    entitlement_type: 'digital_download',
    product_id: productId,
    granted_at: new Date().toISOString(),
    status: 'active',
    stripe_payment_id: stripePaymentId || null,
  }, {
    onConflict: 'user_id,product_id',
  });

  if (error) {
    logger.error('Failed to grant download entitlement', { error, userId, productId });
    return false;
  }

  return true;
}

/**
 * Record purchase for audit trail
 */
async function recordPurchase(
  userId: string,
  sessionId: string,
  productId: string,
  amount: number,
  metadata: Record<string, string>
) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  const { error } = await db.from('purchases').insert({
    user_id: userId,
    stripe_session_id: sessionId,
    product_id: productId,
    amount_cents: amount,
    currency: 'usd',
    status: 'completed',
    metadata,
    purchased_at: new Date().toISOString(),
  });

  if (error) {
    logger.error('Failed to record purchase', { error, userId, sessionId });
  }
}

async function _POST(req: NextRequest) {
  const stripe = getStripe();
  
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    logger.error('Webhook signature verification failed', { error: 'Operation failed' });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    const userId = metadata.user_id;
    const productId = metadata.product_id;
    const productType = metadata.product_type;
    const lmsAccess = metadata.lms_access === 'true';
    const courseSlug = metadata.course_slug;

    logger.info('Processing store purchase', { 
      sessionId: session.id, 
      userId, 
      productId,
      productType,
    });

    // Record the purchase
    if (userId && productId) {
      await recordPurchase(
        userId,
        session.id,
        productId,
        session.amount_total || 0,
        metadata
      );
    }

    const stripePaymentId = session.payment_intent as string;

    // Handle Capital Readiness specific fulfillment
    if (productType === 'capital_readiness') {
      if (userId) {
        // Grant LMS access if applicable
        if (lmsAccess && courseSlug) {
          await grantLmsAccess(userId, courseSlug);
        }

        // Unlock PDF download
        await unlockDownload(userId, productId, stripePaymentId);

        logger.info('Capital Readiness purchase fulfilled', { userId, productId });
      }
    }

    // Generic digital product fulfillment
    if (metadata.delivery === 'digital' && userId && productId) {
      await unlockDownload(userId, productId, stripePaymentId);
    }
  }

  // Handle invoice.payment_succeeded (for enterprise invoices)
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    const metadata = invoice.metadata || {};
    
    if (metadata.license_level === 'enterprise') {
      logger.info('Enterprise invoice paid', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        amount: invoice.amount_paid,
      });
      
      // Enterprise provisioning handled separately via admin workflow
    }
  }

  // Handle charge.refunded - revoke access (fail-closed: must record before mutating)
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = charge.payment_intent as string;

    logger.info('Processing store refund', { chargeId: charge.id, paymentIntentId });

    // Fail-closed idempotency: record in webhook_events_processed before mutating state
    const supabaseForIdem = await createClient();
    const dbIdem = createAdminClient() || supabaseForIdem;
    try {
      const { error: idemErr } = await dbIdem.from('webhook_events_processed').insert({
        provider: 'stripe',
        event_id: event.id,
        event_type: event.type,
        payment_reference: paymentIntentId,
        status: 'processed',
        metadata: { charge_id: charge.id, refund_amount: charge.amount_refunded },
      });
      if (idemErr) {
        if (idemErr.code === '23505') {
          logger.info('Store refund already processed, skipping', { eventId: event.id });
          return NextResponse.json({ received: true, duplicate: true });
        }
        // Cannot record → fail-closed, skip mutation
        logger.error('FAIL-CLOSED: Cannot record store refund event, skipping mutations', { error: idemErr });
        return NextResponse.json({ received: true, skipped: true, reason: 'event_record_failed' });
      }
    } catch (idemCatchErr) {
      logger.error('FAIL-CLOSED: Idempotency insert threw, skipping store refund', idemCatchErr);
      return NextResponse.json({ received: true, skipped: true, reason: 'idempotency_unavailable' });
    }

    if (paymentIntentId) {
      const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

      // Revoke user_entitlements
      const { error: entitlementError } = await db
        .from('user_entitlements')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoke_reason: 'refund',
        })
        .eq('stripe_payment_id', paymentIntentId);

      if (entitlementError) {
        logger.error('Error revoking entitlements on refund', { error: entitlementError });
      }

      // Update purchase record
      const { error: purchaseError } = await db
        .from('purchases')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('stripe_payment_id', paymentIntentId);

      if (purchaseError) {
        logger.error('Error updating purchase on refund', { error: purchaseError });
      }

      // Revoke LMS enrollment if applicable
      const { error: enrollmentError } = await db
        .from('program_enrollments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('payment_id', paymentIntentId);

      if (enrollmentError) {
        logger.error('Error revoking enrollment on refund', { error: enrollmentError });
      }

      // Flag certificates as funding-invalid (credential was earned, but payment reversed)
      try {
        const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
        const userId = paymentIntent.metadata?.user_id;
        if (userId) {
          const programId = paymentIntent.metadata?.program_id;
          let certQuery = db
            .from('certificates')
            .update({
              funding_status: 'refunded',
              funding_status_changed_at: new Date().toISOString(),
              funding_status_reason: `Store refund on charge ${charge.id} (pi: ${paymentIntentId})`,
            })
            .eq('funding_status', 'valid');

          // Try student_id first (certificate generate route uses this)
          certQuery = certQuery.eq('student_id', userId);
          if (programId) certQuery = certQuery.eq('program_id', programId);

          const { error: certErr } = await certQuery;
          if (certErr) {
            // Fallback: some certs use user_id column
            const fallback = db
              .from('certificates')
              .update({
                funding_status: 'refunded',
                funding_status_changed_at: new Date().toISOString(),
                funding_status_reason: `Store refund on charge ${charge.id} (pi: ${paymentIntentId})`,
              })
              .eq('funding_status', 'valid')
              .eq('user_id', userId);
            if (programId) fallback.eq('program_id', programId);
            await fallback;
          }
          logger.info('Flagged certificates as funding-refunded for user', { userId });
        }
      } catch (certFlagErr) {
        logger.error('Error flagging certificates on store refund:', certFlagErr);
      }

      logger.info('Refund processed - access revoked', { chargeId: charge.id });
    }
  }

  return NextResponse.json({ received: true });
}
export const POST = withApiAudit('/api/webhooks/store', _POST, { actor_type: 'webhook', skip_body: true });
