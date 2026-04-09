/**
 * Affirm Webhook Handler
 * 
 * Authoritative enrollment activator for Affirm payments.
 * charge.captured is the source of truth — not the redirect.
 * 
 * Configure webhook URL in Affirm merchant dashboard:
 * https://www.elevateforhumanity.org/api/affirm/webhook
 */


import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { createEnrollmentFromPayment } from '@/lib/enrollment/create-enrollment';
import { logAuditEvent } from '@/lib/audit';
import { claimWebhookEvent, finalizeWebhookEvent } from '@/lib/webhooks/event-tracker';
import { flagCertificatesOnRefund } from '@/lib/certificates/flag-on-refund';
import { BARBER_PRICING } from '@/lib/programs/pricing';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

interface AffirmWebhookEvent {
  type: string;
  data: {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: string;
    created: string;
    [key: string]: any;
  };
}

async function _POST(request: NextRequest) {
  try {
    // Verify webhook authenticity — reject if secret is not set or doesn't match
    const webhookSecret = process.env.AFFIRM_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('Affirm webhook: AFFIRM_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    const providedSecret = request.headers.get('x-affirm-webhook-secret') 
      || request.headers.get('authorization')?.replace('Bearer ', '');
    if (providedSecret !== webhookSecret) {
      logger.warn('Affirm webhook: invalid secret');
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
    }

    const payload = await request.text();
    const event: AffirmWebhookEvent = JSON.parse(payload);

    if (!event.type || !event.data?.order_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Derive a stable event ID for deduplication
    const eventId = event.data?.id
      ? `${event.type}:${event.data.id}`
      : `${event.type}:${event.data?.order_id}:${Date.now()}`;

    logger.info('Affirm webhook received', {
      type: event.type,
      chargeId: event.data?.id,
      orderId: event.data?.order_id,
      eventId,
    });

    // Idempotency: claim this event for processing
    const { shouldProcess, isDuplicate, confident } = await claimWebhookEvent(
      'affirm',
      eventId,
      event.type,
      { chargeId: event.data?.id, orderId: event.data?.order_id },
    );

    if (!shouldProcess) {
      return NextResponse.json({ received: true, idempotent: true, isDuplicate });
    }

    // Fail-closed for state mutations: if we can't confirm this isn't a duplicate,
    // reject and let the provider retry when DB is available
    if (!confident) {
      logger.error('Affirm webhook: cannot verify idempotency — rejecting for retry', { eventId });
      return NextResponse.json({ error: 'Temporary processing error' }, { status: 503 });
    }

    const supabase = await getAdminClient();
    if (!supabase) {
      await finalizeWebhookEvent('affirm', eventId, 'errored', 'DB unavailable');
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    // Look up checkout context by order_id for program metadata
    const { data: context } = await supabase
      .from('checkout_contexts')
      .select('*')
      .eq('provider', 'affirm')
      .eq('order_id', event.data.order_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Also check applications table (legacy path)
    const { data: application } = await supabase
      .from('applications')
      .select('id, affirm_order_id, customer_email, first_name, last_name, phone, program_slug, program_id')
      .eq('affirm_order_id', event.data.order_id)
      .maybeSingle();

    if (!context && !application) {
      logger.warn('Affirm webhook: unknown order_id', { orderId: event.data.order_id });
      return NextResponse.json({ error: 'Unknown order' }, { status: 404 });
    }

    switch (event.type) {
      case 'charge.authorized':
        await handleChargeAuthorized(event, supabase, application);
        break;
      case 'charge.captured':
        await handleChargeCaptured(event, supabase, context, application);
        break;
      case 'charge.voided':
        await handleChargeVoided(event, supabase, application);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event, supabase, application);
        break;
      default:
        logger.info('Unhandled Affirm webhook event', { type: event.type });
    }

    await finalizeWebhookEvent('affirm', eventId, 'processed');
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Affirm webhook error:', error);
    // Best-effort finalize — eventId may not be defined if parsing failed
    try { await finalizeWebhookEvent('affirm', eventId!, 'errored', String(error)); } catch { /* */ }
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleChargeAuthorized(event: AffirmWebhookEvent, supabase: any, application: any) {
  const { id, order_id, amount } = event.data;
  
  logger.info('Affirm charge authorized', { chargeId: id, orderId: order_id, amount });

  if (application) {
    await supabase
      .from('applications')
      .update({
        affirm_charge_id: id,
        payment_status: 'authorized',
      })
      .eq('affirm_order_id', order_id);
  }
}

/**
 * charge.captured is the authoritative enrollment activator.
 * 
 * Routing rules:
 * - barber-apprenticeship → barber_subscriptions
 * - all other programs → createEnrollmentFromPayment() → program_enrollments
 */
async function handleChargeCaptured(
  event: AffirmWebhookEvent,
  supabase: any,
  context: any,
  application: any,
) {
  const { id: chargeId, order_id, amount } = event.data;
  
  logger.info('Affirm charge captured — activating enrollment', {
    chargeId,
    orderId: order_id,
    amount,
    hasContext: !!context,
    hasApplication: !!application,
  });

  // Resolve program and customer info from context or application
  const programSlug = context?.program_slug || application?.program_slug || '';
  const programId = context?.program_id || application?.program_id || '';
  const email = context?.customer_email || application?.customer_email || '';
  const firstName = context?.customer_name?.split(' ')[0] || application?.first_name || '';
  const lastName = context?.customer_name?.split(' ').slice(1).join(' ') || application?.last_name || '';
  const phone = application?.phone || '';

  // Update application payment status
  if (application) {
    await supabase
      .from('applications')
      .update({
        payment_status: 'completed',
        payment_amount: amount / 100,
        payment_completed_at: new Date().toISOString(),
      })
      .eq('affirm_order_id', order_id);
  }

  // Mark checkout context as captured
  if (context) {
    await supabase
      .from('checkout_contexts')
      .update({
        status: 'captured',
        provider_charge_id: chargeId,
      })
      .eq('id', context.id);
  }

  // --- Enrollment activation ---

  const isBarber = programSlug === 'barber-apprenticeship';

  if (isBarber && email) {
    // Barber: create/update barber_subscriptions
    const { data: existingSub } = await supabase
      .from('barber_subscriptions')
      .select('id, status')
      .eq('payment_method', 'affirm')
      .eq('customer_email', email)
      .maybeSingle();

    if (existingSub) {
      await supabase
        .from('barber_subscriptions')
        .update({
          status: 'active',
          amount_paid_at_checkout: amount / 100,
          affirm_charge_id: chargeId,
        })
        .eq('id', existingSub.id);

      logger.info('Affirm barber subscription activated (existing)', {
        subscriptionId: existingSub.id,
        chargeId,
      });

      try {
        await logAuditEvent({
          action: 'ENROLLMENT_ACTIVATED_FROM_PAYMENT',
          actor_id: 'system:affirm_webhook',
          target_type: 'barber_subscription',
          target_id: existingSub.id,
          metadata: {
            payment_provider: 'affirm',
            payment_reference: chargeId,
            program_slug: 'barber-apprenticeship',
            activated_by: 'webhook:charge.captured',
          },
        });
      } catch { /* audit best-effort */ }
    } else {
      const totalHoursRequired = BARBER_PRICING.totalHoursRequired || 2000;
      const transferHours = context?.transfer_hours || 0;
      const hoursPerWeek = context?.hours_per_week || 40;
      const hoursRemaining = Math.max(0, totalHoursRequired - transferHours);
      const weeksRemaining = Math.ceil(hoursRemaining / hoursPerWeek);

      const { data: newSub, error: subError } = await supabase
        .from('barber_subscriptions')
        .insert({
          customer_email: email,
          customer_name: `${firstName} ${lastName}`.trim(),
          status: 'active',
          full_tuition_amount: BARBER_PRICING.fullPrice,
          amount_paid_at_checkout: amount / 100,
          remaining_balance: Math.max(0, (BARBER_PRICING.fullPrice * 100 - amount) / 100),
          payment_method: 'affirm',
          bnpl_provider: 'affirm',
          affirm_charge_id: chargeId,
          fully_paid: amount >= BARBER_PRICING.fullPrice * 100,
          weekly_payment_cents: 0,
          weeks_remaining: weeksRemaining,
          hours_per_week: hoursPerWeek,
          transferred_hours_verified: transferHours,
          payment_model: 'bnpl_affirm',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (subError) {
        logger.error('Failed to create barber subscription from Affirm webhook', subError);
      } else {
        logger.info('Affirm barber subscription created', {
          subscriptionId: newSub?.id,
          chargeId,
          email,
        });

        try {
          await logAuditEvent({
            action: 'ENROLLMENT_CREATED_FROM_PAYMENT',
            actor_id: 'system:affirm_webhook',
            target_type: 'barber_subscription',
            target_id: newSub?.id,
            metadata: {
              payment_provider: 'affirm',
              payment_reference: chargeId,
              program_slug: 'barber-apprenticeship',
              customer_email: email,
              amount_cents: amount,
              activated_by: 'webhook:charge.captured',
            },
          });
        } catch { /* audit best-effort */ }
      }
    }
  } else if (programId && email) {
    // Non-barber: use shared enrollment factory
    const result = await createEnrollmentFromPayment({
      programId,
      programSlug,
      email,
      firstName,
      lastName,
      phone,
      applicationId: application?.id,
      paymentProvider: 'affirm',
      paymentReference: chargeId,
      paymentAmountCents: amount,
      fundingSource: 'self_pay',
    });

    if (result.success) {
      logger.info('Affirm enrollment created via webhook', {
        enrollmentId: result.enrollmentId,
        studentId: result.studentId,
        programId,
        chargeId,
        isNew: result.isNewEnrollment,
      });
    } else {
      logger.error('Affirm enrollment creation failed', {
        error: result.error,
        programId,
        chargeId,
        email,
      });
    }
  } else {
    logger.warn('Affirm charge.captured: insufficient data for enrollment', {
      chargeId,
      orderId: order_id,
      hasProgramId: !!programId,
      hasEmail: !!email,
      programSlug,
    });
  }
}

async function handleChargeVoided(event: AffirmWebhookEvent, supabase: any, application: any) {
  const { id, order_id } = event.data;
  
  logger.info('Affirm charge voided', { chargeId: id, orderId: order_id });

  if (application) {
    await supabase
      .from('applications')
      .update({ payment_status: 'voided' })
      .eq('affirm_order_id', order_id);
  }

  // Deactivate any enrollment created from this charge
  await deactivateEnrollmentForCharge(supabase, id, application, 'voided');
}

async function handleChargeRefunded(event: AffirmWebhookEvent, supabase: any, application: any) {
  const { id, order_id, amount } = event.data;
  
  logger.info('Affirm charge refunded', { chargeId: id, orderId: order_id, amount });

  if (application) {
    await supabase
      .from('applications')
      .update({
        payment_status: 'refunded',
        refund_amount: amount / 100,
        refunded_at: new Date().toISOString(),
      })
      .eq('affirm_order_id', order_id);
  }

  // Deactivate any enrollment created from this charge
  await deactivateEnrollmentForCharge(supabase, id, application, 'refunded');
}

/**
 * Deactivate enrollments when an Affirm charge is refunded or voided.
 * Checks both barber_subscriptions and program_enrollments.
 */
async function deactivateEnrollmentForCharge(
  supabase: any,
  chargeId: string,
  application: any,
  reason: 'refunded' | 'voided',
) {
  const now = new Date().toISOString();

  // Deactivate barber subscription if linked to this charge
  const { data: barberSub } = await supabase
    .from('barber_subscriptions')
    .select('id, status')
    .eq('affirm_charge_id', chargeId)
    .eq('status', 'active')
    .maybeSingle();

  if (barberSub) {
    await supabase
      .from('barber_subscriptions')
      .update({
        status: reason,
        deactivated_at: now,
        deactivation_reason: `affirm_charge_${reason}`,
      })
      .eq('id', barberSub.id);

    logger.info(`Affirm barber subscription deactivated (${reason})`, {
      subscriptionId: barberSub.id,
      chargeId,
    });

    try {
      await logAuditEvent({
        action: `ENROLLMENT_DEACTIVATED_${reason.toUpperCase()}`,
        actor_id: 'system:affirm_webhook',
        target_type: 'barber_subscription',
        target_id: barberSub.id,
        metadata: {
          payment_provider: 'affirm',
          payment_reference: chargeId,
          reason: `affirm_charge_${reason}`,
          deactivated_by: `webhook:charge.${reason}`,
        },
      });
    } catch { /* audit best-effort */ }
  }

  // Deactivate program enrollment if linked via payment_reference
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, status')
    .eq('payment_reference', chargeId)
    .eq('payment_provider', 'affirm')
    .eq('status', 'active')
    .maybeSingle();

  if (enrollment) {
    await supabase
      .from('program_enrollments')
      .update({
        status: reason,
        deactivated_at: now,
        deactivation_reason: `affirm_charge_${reason}`,
      })
      .eq('id', enrollment.id);

    logger.info(`Affirm program enrollment deactivated (${reason})`, {
      enrollmentId: enrollment.id,
      chargeId,
    });

    try {
      await logAuditEvent({
        action: `ENROLLMENT_DEACTIVATED_${reason.toUpperCase()}`,
        actor_id: 'system:affirm_webhook',
        target_type: 'program_enrollment',
        target_id: enrollment.id,
        metadata: {
          payment_provider: 'affirm',
          payment_reference: chargeId,
          reason: `affirm_charge_${reason}`,
          deactivated_by: `webhook:charge.${reason}`,
        },
      });
    } catch { /* audit best-effort */ }
  }

  // If neither found, log for reconciliation
  if (!barberSub && !enrollment) {
    logger.warn(`Affirm ${reason}: no active enrollment found for charge`, {
      chargeId,
      applicationId: application?.id,
    });
  }

  // Flag any certificates issued to this student
  const studentEmail = application?.customer_email;
  const flagged = await flagCertificatesOnRefund({
    supabase,
    studentEmail,
    enrollmentId: enrollment?.id,
    reason,
    paymentProvider: 'affirm',
    paymentReference: chargeId,
  });

  if (flagged > 0) {
    logger.info(`Affirm ${reason}: flagged ${flagged} certificates`, { chargeId, studentEmail });
  }
}

export const POST = withApiAudit('/api/affirm/webhook', _POST, { actor_type: 'webhook', skip_body: true });
