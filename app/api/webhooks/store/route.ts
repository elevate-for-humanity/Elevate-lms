/* eslint-disable no-empty */
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_STORE || '';

/**
 * Grant LMS course access to user via training_enrollments.
 * Accepts either a course slug or a course UUID.
 * Uses training_enrollments (not program_enrollments — that requires program_id NOT NULL).
 */
async function grantLmsAccess(
  userId: string,
  courseSlugOrId: string,
  stripeSessionId?: string,
  amountPaidCents?: number
): Promise<boolean> {
  const adminDb = createAdminClient();
  if (!adminDb) {
    logger.error('grantLmsAccess: no admin DB client');
    return false;
  }

  // Resolve course by slug or UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseSlugOrId);
  const { data: course } = await adminDb
    .from('training_courses')
    .select('id, course_name, slug')
    .eq(isUuid ? 'id' : 'slug', courseSlugOrId)
    .single();

  if (!course) {
    logger.warn('grantLmsAccess: course not found', { courseSlugOrId, userId });
    return false;
  }

  // Upsert into training_enrollments — the correct table for self-serve course purchases
  const { error } = await adminDb
    .from('training_enrollments')
    .upsert({
      user_id: userId,
      course_id: course.id,
      status: 'active',
      enrolled_at: new Date().toISOString(),
      payment_method: 'self_pay',
      payment_option: 'full',
      funding_source: 'self_pay',
      stripe_checkout_session_id: stripeSessionId || null,
      amount_paid: amountPaidCents ? amountPaidCents / 100 : null,
      program_slug: course.slug || null,
    }, {
      onConflict: 'user_id,course_id',
      ignoreDuplicates: false,
    });

  if (error) {
    logger.error('grantLmsAccess: enrollment upsert failed', { error, userId, courseSlugOrId });
    return false;
  }

  logger.info('grantLmsAccess: enrollment created', { userId, courseId: course.id, courseName: course.course_name });
  return true;
}

/**
 * Unlock digital download for user
 */
async function unlockDownload(userId: string, productId: string, stripePaymentId?: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('user_entitlements').upsert({
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

  const { error } = await supabase.from('purchases').insert({
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
    const amountPaidCents = session.amount_total || 0;
    const stripePaymentId = session.payment_intent as string;

    // Support singular (legacy direct checkout) and plural (cart checkout) course slug fields
    const courseSlug = metadata.course_slug;
    const courseSlugs: string[] = metadata.course_slugs
      ? metadata.course_slugs.split(',').map((s: string) => s.trim()).filter(Boolean)
      : courseSlug ? [courseSlug] : [];

    logger.info('Processing store purchase', {
      sessionId: session.id,
      userId,
      productId,
      productType,
      lmsAccess,
      courseSlugs,
      amountPaidCents,
    });

    // Record the purchase audit trail
    if (userId && productId) {
      await recordPurchase(userId, session.id, productId, amountPaidCents, metadata);
    }

    // ── LMS enrollment fulfillment ──────────────────────────────────────────
    // Triggered by: cart checkout (course_slugs) or direct checkout (course_slug)
    if (userId && lmsAccess && courseSlugs.length > 0) {
      for (const slug of courseSlugs) {
        const granted = await grantLmsAccess(userId, slug, session.id, amountPaidCents);
        logger.info('LMS enrollment result', { userId, slug, granted });
      }
    }

    // ── Product-type specific fulfillment ───────────────────────────────────
    if (productType === 'capital_readiness' && userId && productId) {
      await unlockDownload(userId, productId, stripePaymentId);
      logger.info('Capital Readiness fulfilled', { userId, productId });
    }

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
          try { await dbIdem.from('webhook_retry_log').insert({ provider: 'stripe', event_id: event.id, event_type: event.type, outcome: 'duplicate_skipped', metadata: { source: 'store_webhook' } }); } catch (_) {}
          return NextResponse.json({ received: true, duplicate: true });
        }
        logger.error('FAIL-CLOSED: Cannot record store refund event, skipping mutations', { error: idemErr });
        try { await dbIdem.from('webhook_retry_log').insert({ provider: 'stripe', event_id: event.id, event_type: event.type, outcome: 'record_failed', metadata: { source: 'store_webhook' } }); } catch (_) {}
        return NextResponse.json({ received: true, skipped: true, reason: 'event_record_failed' });
      }
    } catch (idemCatchErr) {
      logger.error('FAIL-CLOSED: Idempotency insert threw, skipping store refund', idemCatchErr);
      // Best-effort retry log — dbIdem may not be available if this threw
      try { const fallbackDb = createAdminClient(); if (fallbackDb) await fallbackDb.from('webhook_retry_log').insert({ provider: 'stripe', event_id: event.id, event_type: event.type, outcome: 'idempotency_failed', metadata: { source: 'store_webhook' } }); } catch (_) {}
      return NextResponse.json({ received: true, skipped: true, reason: 'idempotency_unavailable' });
    }

    if (paymentIntentId) {
      const supabase = await createClient();

      // Revoke user_entitlements
      const { error: entitlementError } = await supabase
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
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('stripe_payment_id', paymentIntentId);

      if (purchaseError) {
        logger.error('Error updating purchase on refund', { error: purchaseError });
      }

      // POLICY: Refund reverses funding, not training.
      // Training status is untouched; admin must explicitly terminate if needed.
      const { error: enrollmentError } = await supabase
        .from('program_enrollments')
        .update({
          funding_status: 'refunded',
          funding_status_changed_at: new Date().toISOString(),
          funding_status_reason: `Store refund on charge ${charge.id}`,
        })
        .eq('payment_id', paymentIntentId);

      if (enrollmentError) {
        logger.error('Error updating enrollment funding_status on refund', { error: enrollmentError });
      }

      // Flag certificates as funding-invalid (credential was earned, but payment reversed)
      try {
        const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
        const userId = paymentIntent.metadata?.user_id;
        if (userId) {
          const programId = paymentIntent.metadata?.program_id;
          const SYSTEM_WEBHOOK_ACTOR = '00000000-0000-0000-0000-000000000001';
          let certQuery = supabase
            .from('certificates')
            .update({
              funding_status: 'refunded',
              funding_status_changed_at: new Date().toISOString(),
              funding_status_changed_by: SYSTEM_WEBHOOK_ACTOR,
              funding_status_reason: `Store refund on charge ${charge.id} (pi: ${paymentIntentId})`,
            })
            .eq('funding_status', 'valid');

          // Try student_id first (certificate generate route uses this)
          certQuery = certQuery.eq('student_id', userId);
          if (programId) certQuery = certQuery.eq('program_id', programId);

          const { error: certErr } = await certQuery;
          if (certErr) {
            // Fallback: some certs use user_id column
            const fallback = supabase
              .from('certificates')
              .update({
                funding_status: 'refunded',
                funding_status_changed_at: new Date().toISOString(),
                funding_status_changed_by: SYSTEM_WEBHOOK_ACTOR,
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
