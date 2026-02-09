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
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { createEnrollmentFromPayment } from '@/lib/enrollment/create-enrollment';
import { BARBER_PRICING } from '@/lib/programs/pricing';
import crypto from 'crypto';

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
 * Verify Sezzle webhook signature
 * Sezzle uses HMAC-SHA256 for webhook verification
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

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('sezzle-signature');
    const webhookSecret = process.env.SEZZLE_WEBHOOK_SECRET;

    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && webhookSecret) {
      if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
        logger.warn('Sezzle webhook signature verification failed');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event: SezzleWebhookEvent = JSON.parse(payload);

    logger.info('Sezzle webhook received', {
      eventId: event.event_id,
      eventType: event.event_type,
      orderUuid: event.data.order_uuid,
      referenceId: event.data.reference_id,
    });

    const supabase = await createClient();

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
        logger.info('Unhandled Sezzle webhook event', { eventType: event.event_type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Sezzle webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
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

  logger.info('Sezzle order captured - processing enrollment', {
    orderUuid: order_uuid,
    referenceId: reference_id,
    captured: capture?.captured,
    amount: capture?.amount?.amount_in_cents,
    customerEmail: customer?.email,
  });

  if (!supabase) return;

  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: 'captured',
      captured_at: new Date().toISOString(),
      captured_amount_cents: capture?.amount?.amount_in_cents,
    })
    .eq('provider_order_id', order_uuid);

  // Parse reference_id to get program and application info
  // Format: "EFH-{timestamp}-{random}" or custom format with metadata
  const programId = metadata?.program_id;
  const programSlug = metadata?.program_slug;
  const applicationId = metadata?.application_id;
  const studentId = metadata?.student_id;

  // If we have program info, create enrollment
  if (programId && customer?.email) {
    // For barber program, create barber_subscriptions record
    if (programSlug === 'barber-apprenticeship') {
      try {
        const adminClient = createAdminClient();
        const amountPaidCents = capture?.amount?.amount_in_cents || 0;
        const transferHours = parseInt(metadata?.transfer_hours || '0');
        const hoursPerWeek = parseInt(metadata?.hours_per_week || '40');
        const totalHoursRequired = BARBER_PRICING.totalHoursRequired || 2000;
        const hoursRemaining = Math.max(0, totalHoursRequired - transferHours);
        const weeksRemaining = Math.ceil(hoursRemaining / hoursPerWeek);

        await adminClient.from('barber_subscriptions').insert({
          customer_email: customer.email,
          customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          status: 'active',
          full_tuition_amount: BARBER_PRICING.fullPrice,
          amount_paid_at_checkout: amountPaidCents / 100,
          remaining_balance: Math.max(0, (BARBER_PRICING.fullPrice * 100 - amountPaidCents) / 100),
          payment_method: 'sezzle',
          bnpl_provider: 'sezzle',
          fully_paid: amountPaidCents >= BARBER_PRICING.fullPrice * 100,
          weekly_payment_cents: 0, // Sezzle handles payments
          weeks_remaining: weeksRemaining,
          hours_per_week: hoursPerWeek,
          transferred_hours_verified: transferHours,
          payment_model: 'bnpl_sezzle',
          created_at: new Date().toISOString(),
        });

        logger.info('Barber subscription created for Sezzle payment', {
          customerEmail: customer.email,
          orderUuid: order_uuid,
          amountPaidCents,
        });
      } catch (dbError) {
        logger.error('Failed to create barber_subscriptions record for Sezzle:', dbError);
      }
    }

    const result = await createEnrollmentFromPayment({
      studentId: studentId,
      programId: programId,
      programSlug: programSlug,
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
        .from('enrollments')
        .update({
          status: 'active',
          payment_status: 'paid',
          activated_at: new Date().toISOString(),
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
      .from('enrollments')
      .update({
        status: 'refunded',
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', payment.enrollment_id);
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
