/**
 * Sezzle Webhook Handler
 * 
 * Handles webhook events from Sezzle for order status updates.
 * Configure webhook URL in Sezzle merchant dashboard:
 * https://yourdomain.com/api/sezzle/webhook
 * 
 * Events:
 * - order.authorized: Customer completed checkout, funds authorized
 * - order.captured: Funds captured successfully - CREATES ENROLLMENT
 * - order.refunded: Order was refunded
 * - order.released: Authorization was released
 * - checkout.completed: Virtual card checkout completed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { createEnrollmentFromPayment } from '@/lib/enrollment/create-enrollment';
import { claimWebhookEvent, finalizeWebhookEvent } from '@/lib/webhooks/event-tracker';
import { flagCertificatesOnRefund } from '@/lib/certificates/flag-on-refund';
import { BARBER_PRICING } from '@/lib/programs/pricing';
import crypto from 'crypto';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import * as Sentry from '@sentry/nextjs';

interface SezzleWebhookEvent {
  event_id: string;
  event_type: string;
  created_at: string;
  data: {
    order_uuid?: string;
    session_uuid?: string;
    reference_id?: string;
    amount?: {
      amount_in_cents: number;
      currency: string;
    };
    customer?: {
      email?: string;
      first_name?: string;
      last_name?: string;
    };
    authorization?: {
      approved: boolean;
      amount: {
        amount_in_cents: number;
        currency: string;
      };
    };
    capture?: {
      captured: boolean;
      amount: {
        amount_in_cents: number;
        currency: string;
      };
    };
    refund?: {
      refunded: boolean;
      amount: {
        amount_in_cents: number;
        currency: string;
      };
    };
    // Virtual card specific
    card?: {
      token?: string;
    };
    metadata?: Record<string, string>;
  };
}

/**
 * Verify Sezzle webhook signature (HMAC-SHA256)
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // timingSafeEqual requires equal-length buffers
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

async function _POST(request: NextRequest) {
  let payload: string;
  try {
    payload = await request.text();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const signature = request.headers.get('sezzle-signature');
  const webhookSecret = process.env.SEZZLE_WEBHOOK_SECRET;

  // Verify signature — required in production
  if (webhookSecret) {
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      logger.warn('[Sezzle Webhook] Signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    logger.error('[Sezzle Webhook] SEZZLE_WEBHOOK_SECRET not set in production — rejecting request');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  } else {
    logger.warn('[Sezzle Webhook] SEZZLE_WEBHOOK_SECRET not set — skipping signature verification (dev only)');
  }

  // After signature verification, always return 200 to prevent retries
  try {
    const event: SezzleWebhookEvent = JSON.parse(payload);

    logger.info('[Sezzle Webhook] Event received', {
      eventId: event.event_id,
      eventType: event.event_type,
      orderUuid: event.data.order_uuid,
      referenceId: event.data.reference_id,
    });

    // Event-level deduplication via webhook_events_processed
    const sezzleEventId = event.event_id || `${event.event_type}:${event.data.order_uuid}`;
    const { shouldProcess, confident } = await claimWebhookEvent(
      'sezzle',
      sezzleEventId,
      event.event_type,
      { orderUuid: event.data.order_uuid, referenceId: event.data.reference_id },
    );

    if (!shouldProcess) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    // Fail-closed: if deduplication check is not authoritative, reject for retry
    if (!confident) {
      logger.error('[Sezzle Webhook] Cannot verify idempotency — rejecting for retry', { eventId: sezzleEventId });
      return NextResponse.json({ error: 'Temporary processing error' }, { status: 503 });
    }

    // Use admin client — webhooks have no user session, RLS would block writes
    const supabase = createAdminClient();
    if (!supabase) {
      logger.error('[Sezzle Webhook] createAdminClient returned null — SUPABASE_SERVICE_ROLE_KEY likely missing. DB writes will be skipped.');
      await finalizeWebhookEvent('sezzle', sezzleEventId, 'errored', 'DB unavailable');
    }

    // Legacy deduplication (kept as secondary check)
    if (supabase && event.data.order_uuid && event.event_type === 'order.captured') {
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('provider_order_id', event.data.order_uuid)
        .eq('status', 'captured')
        .maybeSingle();

      if (existing) {
        logger.info('[Sezzle Webhook] Duplicate capture event — already processed', {
          eventId: event.event_id,
          orderUuid: event.data.order_uuid,
          existingPaymentId: existing.id,
        });
        await finalizeWebhookEvent('sezzle', sezzleEventId, 'skipped');
        return NextResponse.json({ received: true, duplicate: true });
      }
    }

    switch (event.event_type) {
      case 'order.authorized':
        await handleOrderAuthorized(event, supabase);
        break;

      case 'order.captured':
        await handleOrderCaptured(event, supabase);
        break;

      case 'order.refunded':
        await handleOrderRefunded(event, supabase);
        break;

      case 'order.released':
        await handleOrderReleased(event, supabase);
        break;

      case 'checkout.completed':
        await handleCheckoutCompleted(event, supabase);
        break;

      default:
        logger.info('[Sezzle Webhook] Unhandled event type', { eventType: event.event_type });
    }
    await finalizeWebhookEvent('sezzle', sezzleEventId, 'processed');
  } catch (error) {
    // Log but still return 200 — don't let processing errors cause retries
    logger.error('[Sezzle Webhook] Processing error:', error);
    try { await finalizeWebhookEvent('sezzle', sezzleEventId, 'errored', String(error)); } catch { /* */ }
  }

  return NextResponse.json({ received: true });
}

async function handleOrderAuthorized(event: SezzleWebhookEvent, supabase: any) {
  const { order_uuid, reference_id, authorization, customer } = event.data;

  logger.info('Sezzle order authorized', {
    orderUuid: order_uuid,
    referenceId: reference_id,
    approved: authorization?.approved,
    amount: authorization?.amount?.amount_in_cents,
  });

  if (!supabase) return;

  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: 'authorized',
      authorized_at: new Date().toISOString(),
      authorized_amount_cents: authorization?.amount?.amount_in_cents,
    })
    .eq('provider_order_id', order_uuid);

  // Update application if exists
  if (reference_id) {
    await supabase
      .from('applications')
      .update({
        payment_status: 'authorized',
      })
      .eq('sezzle_reference_id', reference_id);
  }
}

async function handleOrderCaptured(event: SezzleWebhookEvent, supabase: any) {
  const { order_uuid, reference_id, capture, customer, metadata } = event.data;

  // Read server-authoritative price resolution from metadata
  const paymentOption = metadata?.payment_option || 'deposit';
  const requiredAmountCents = parseInt(metadata?.required_amount_cents || '0');
  const paidAmountCents = capture?.amount?.amount_in_cents || 0;
  const overpayAmountCents = parseInt(metadata?.overpay_amount_cents || '0');

  logger.info('[Sezzle Webhook] Order captured — processing enrollment', {
    orderUuid: order_uuid,
    referenceId: reference_id,
    paymentOption,
    requiredAmountCents,
    paidAmountCents,
    overpayAmountCents,
    customerEmail: customer?.email,
  });

  if (!supabase) return;

  // Update payment record with resolution data
  await supabase
    .from('payments')
    .update({
      status: 'captured',
      captured_at: new Date().toISOString(),
      captured_amount_cents: paidAmountCents,
      metadata: {
        payment_option: paymentOption,
        required_amount_cents: requiredAmountCents,
        overpay_amount_cents: overpayAmountCents,
      },
    })
    .eq('provider_order_id', order_uuid);

  const programId = metadata?.program_id;
  const programSlug = metadata?.program_slug;
  const applicationId = metadata?.application_id;
  const studentId = metadata?.student_id;

  // If we have program info, create enrollment
  if (programId && customer?.email) {
    // For barber program, create barber_subscriptions record
    if (programSlug === 'barber-apprenticeship') {
      try {
        const transferHours = parseInt(metadata?.transfer_hours || '0');
        const hoursPerWeek = parseInt(metadata?.hours_per_week || '40');
        const totalHoursRequired = BARBER_PRICING.totalHoursRequired || 2000;
        const hoursRemaining = Math.max(0, totalHoursRequired - transferHours);
        const weeksRemaining = Math.ceil(hoursRemaining / hoursPerWeek);
        // Remaining balance: full tuition minus what was paid
        const remainingBalance = Math.max(0, (BARBER_PRICING.fullPrice * 100 - paidAmountCents) / 100);

        await supabase.from('barber_subscriptions').insert({
          customer_email: customer.email,
          customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          status: 'active',
          full_tuition_amount: BARBER_PRICING.fullPrice,
          amount_paid_at_checkout: paidAmountCents / 100,
          remaining_balance: remainingBalance,
          payment_method: 'sezzle',
          bnpl_provider: 'sezzle',
          fully_paid: paymentOption === 'full' || paidAmountCents >= BARBER_PRICING.fullPrice * 100,
          weekly_payment_cents: paymentOption === 'full' ? 0 : (weeksRemaining > 0 ? Math.round(remainingBalance / weeksRemaining * 100) : 0),
          weeks_remaining: paymentOption === 'full' ? 0 : weeksRemaining,
          hours_per_week: hoursPerWeek,
          transferred_hours_verified: transferHours,
          payment_model: `bnpl_sezzle_${paymentOption}`,
          created_at: new Date().toISOString(),
        });

        logger.info('[Sezzle Webhook] Barber subscription created', {
          customerEmail: customer.email,
          orderUuid: order_uuid,
          paymentOption,
          paidAmountCents,
          requiredAmountCents,
          remainingBalance,
        });
      } catch (dbError) {
        logger.error('Failed to create barber_subscriptions record for Sezzle:', dbError);
      }
    }

    const result = await createEnrollmentFromPayment({
      studentId: studentId,
      programId: programId,
      programSlug: programSlug,
      courseId: programSlug === 'barber-apprenticeship'
        ? '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
        : undefined,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      applicationId: applicationId,
      paymentProvider: 'sezzle',
      paymentReference: order_uuid,
      paymentAmountCents: capture?.amount?.amount_in_cents,
    });

    if (result.success) {
      logger.info('Sezzle enrollment created successfully', {
        orderUuid: order_uuid,
        enrollmentId: result.enrollmentId,
        studentId: result.studentId,
        isNewUser: result.isNewUser,
      });

      // Update payment record with enrollment ID
      if (result.enrollmentId) {
        await supabase
          .from('payments')
          .update({ enrollment_id: result.enrollmentId })
          .eq('provider_order_id', order_uuid);
      }
    } else {
      logger.error('Sezzle enrollment creation failed', {
        orderUuid: order_uuid,
        error: result.error,
      });
    }
  } else {
    // No program info - just update application status
    if (reference_id) {
      await supabase
        .from('applications')
        .update({
          payment_status: 'completed',
          payment_completed_at: new Date().toISOString(),
        })
        .eq('sezzle_reference_id', reference_id);
    }

    // Check if there's an existing enrollment to activate
    const { data: payment } = await supabase
      .from('payments')
      .select('enrollment_id')
      .eq('provider_order_id', order_uuid)
      .single();

    if (payment?.enrollment_id) {
      await supabase
        .from('program_enrollments')
        .update({
          status: 'active',
          payment_status: 'paid',
          activated_at: new Date().toISOString(),
          ...(programSlug === 'barber-apprenticeship'
            ? { course_id: '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17' }
            : {}),
        })
        .eq('id', payment.enrollment_id);

      logger.info('Sezzle activated existing enrollment', {
        enrollmentId: payment.enrollment_id,
      });
    }
  }
}

async function handleOrderRefunded(event: SezzleWebhookEvent, supabase: any) {
  const { order_uuid, reference_id, refund } = event.data;

  logger.info('Sezzle order refunded', {
    orderUuid: order_uuid,
    referenceId: reference_id,
    refunded: refund?.refunded,
    amount: refund?.amount?.amount_in_cents,
  });

  if (!supabase) return;

  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      refunded_amount_cents: refund?.amount?.amount_in_cents,
    })
    .eq('provider_order_id', order_uuid);

  // Update application
  if (reference_id) {
    await supabase
      .from('applications')
      .update({
        payment_status: 'refunded',
      })
      .eq('sezzle_reference_id', reference_id);
  }

  // Deactivate enrollment
  const { data: payment } = await supabase
    .from('payments')
    .select('enrollment_id')
    .eq('provider_order_id', order_uuid)
    .single();

  if (payment?.enrollment_id) {
    await supabase
      .from('program_enrollments')
      .update({
        status: 'refunded',
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', payment.enrollment_id);

    // Flag certificates issued under this enrollment
    await flagCertificatesOnRefund({
      supabase,
      enrollmentId: payment.enrollment_id,
      reason: 'refunded',
      paymentProvider: 'sezzle',
      paymentReference: order_uuid,
    });
  }
}

async function handleOrderReleased(event: SezzleWebhookEvent, supabase: any) {
  const { order_uuid, reference_id } = event.data;

  logger.info('Sezzle order released', {
    orderUuid: order_uuid,
    referenceId: reference_id,
  });

  if (!supabase) return;

  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
    })
    .eq('provider_order_id', order_uuid);

  // Update application
  if (reference_id) {
    await supabase
      .from('applications')
      .update({
        payment_status: 'released',
      })
      .eq('sezzle_reference_id', reference_id);
  }
}

async function handleCheckoutCompleted(event: SezzleWebhookEvent, supabase: any) {
  const { order_uuid, session_uuid, reference_id, card, customer, metadata } = event.data;

  logger.info('Sezzle virtual card checkout completed', {
    orderUuid: order_uuid,
    sessionUuid: session_uuid,
    referenceId: reference_id,
    hasCardToken: !!card?.token,
    customerEmail: customer?.email,
  });

  if (!supabase) return;

  // Update payment record with virtual card info
  await supabase
    .from('payments')
    .update({
      status: 'checkout_completed',
      checkout_completed_at: new Date().toISOString(),
      card_token: card?.token,
    })
    .eq('provider_session_id', session_uuid);

  // Update application
  if (reference_id) {
    await supabase
      .from('applications')
      .update({
        payment_status: 'checkout_completed',
        sezzle_card_token: card?.token,
      })
      .eq('sezzle_reference_id', reference_id);
  }
}
export const POST = withApiAudit('/api/sezzle/webhook', _POST, { actor_type: 'webhook', skip_body: true });
