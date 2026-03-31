/**
 * Canonical Stripe Webhook Handler
 * 
 * This is the ONLY webhook endpoint that should be registered in Stripe.
 * Path: /api/webhooks/stripe
 * 
 * Event handlers (line numbers approximate):
 *   checkout.session.completed:
 *     - kind=program_enrollment    → upserts student_enrollments
 *     - type=donation              → inserts donations
 *     - kind=apprenticeship_enrollment → updates applications + student_enrollments
 *     - kind=license_purchase      → creates licenses + tenants
 *     - kind=store_purchase        → creates orders
 *     - kind=course_purchase       → creates enrollments
 *     - (default checkout)         → various enrollment paths
 *   payment_intent.succeeded       → logs to payment_logs
 *   payment_intent.payment_failed  → logs failure
 *   customer.subscription.created  → updates licenses
 *   customer.subscription.updated  → updates licenses
 *   customer.subscription.deleted  → suspends/cancels license
 *   invoice.payment_succeeded      → extends license period
 *   invoice.payment_failed         → flags license
 *   charge.refunded                → processes refund
 * 
 * Tables written: student_enrollments, program_enrollments, enrollments,
 *   licenses, license_events, donations, payments, payment_logs,
 *   audit_logs, tenants, applications
 * 
 */

import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { createEnrollmentCase, submitCaseForSignatures } from '@/lib/workflow/case-management';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { createOrUpdateEnrollment, linkOrphanedEnrollments } from '@/lib/enrollment-service';
import { handleCheckoutSessionCompleted } from '@/lib/stripe/handlers/checkout-session-completed';
import { 
  getBillingAuthority, 
  getUpdatableFields,
  isSubscriptionTier,
  assertSubscriptionData,
} from '@/lib/licensing/billing-authority';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { claimWebhookEvent, finalizeWebhookEvent } from '@/lib/webhooks/event-tracker';
import { flagCertificatesOnRefund } from '@/lib/certificates/flag-on-refund';
import * as Sentry from '@sentry/nextjs';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';



// Supabase admin client — resolved per-request to avoid frozen null at cold start.
// Returns null if env vars are missing rather than throwing.
function getSupabase(): SupabaseClient | null {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Flag certificates as funding-invalid when a refund occurs.
 * Does NOT delete or revoke the credential — the student earned it.
 * Sets funding_status='refunded' so downstream systems (ETPL, WIOA reports)
 * know the payment backing this credential was reversed.
 */
async function flagCertificatesForRefund(
  db: SupabaseClient,
  userId: string,
  paymentIntentId: string,
  chargeId: string,
  enrollmentId?: string | null,
  programId?: string | null,
) {
  try {
    // Strategy: find certificates by enrollment → program, or by user + program
    // Certificates don't store payment_intent_id directly, so we trace through enrollments
    let certQuery = db
      .from('certificates')
      .select('id, certificate_number, funding_status')
      .eq('funding_status', 'valid'); // only flag currently-valid certs

    if (enrollmentId) {
      // Look up the enrollment to get course_id / program_id
      const { data: enrollment } = await db
        .from('program_enrollments')
        .select('course_id, program_id, user_id')
        .eq('id', enrollmentId)
        .single();

      if (enrollment) {
        certQuery = certQuery.eq('student_id', enrollment.user_id || userId);
        if (enrollment.program_id) {
          certQuery = certQuery.eq('program_id', enrollment.program_id);
        } else if (enrollment.course_id) {
          certQuery = certQuery.eq('course_id', enrollment.course_id);
        }
      } else {
        // Enrollment not found — fall back to user_id + program_id if available
        certQuery = certQuery.eq('student_id', userId);
        if (programId) certQuery = certQuery.eq('program_id', programId);
      }
    } else {
      // No enrollment_id — match by user + program if we have it
      certQuery = certQuery.eq('student_id', userId);
      if (programId) certQuery = certQuery.eq('program_id', programId);
    }

    const { data: certs, error: fetchErr } = await certQuery;

    if (fetchErr) {
      // certificates table may use user_id instead of student_id in some rows
      logger.warn('[webhook] Certificate lookup by student_id failed, trying user_id:', fetchErr.message);
      let fallbackQuery = db
        .from('certificates')
        .select('id, certificate_number, funding_status')
        .eq('funding_status', 'valid')
        .eq('user_id', userId);
      if (programId) fallbackQuery = fallbackQuery.eq('program_id', programId);
      const { data: fallbackCerts, error: fallbackErr } = await fallbackQuery;
      if (fallbackErr || !fallbackCerts?.length) {
        logger.info('[webhook] No valid certificates found to flag for refund');
        return;
      }
      await flagCertRows(db, fallbackCerts, chargeId, paymentIntentId);
      return;
    }

    if (!certs?.length) {
      logger.info('[webhook] No valid certificates found to flag for refund');
      return;
    }

    await flagCertRows(db, certs, chargeId, paymentIntentId);
  } catch (err) {
    logger.error('[webhook] Error flagging certificates for refund:', err);
  }
}

// System actor UUID for webhook-initiated changes (not a real user).
// Auditors can identify this as an automated system action.
const SYSTEM_WEBHOOK_ACTOR = '00000000-0000-0000-0000-000000000001';

async function flagCertRows(
  db: SupabaseClient,
  certs: Array<{ id: string; certificate_number?: string }>,
  chargeId: string,
  paymentIntentId: string,
) {
  const certIds = certs.map((c) => c.id);
  const { error: updateErr, count } = await db
    .from('certificates')
    .update({
      funding_status: 'refunded',
      funding_status_changed_at: new Date().toISOString(),
      funding_status_changed_by: SYSTEM_WEBHOOK_ACTOR,
      funding_status_reason: `Stripe refund on charge ${chargeId} (pi: ${paymentIntentId})`,
    })
    .in('id', certIds)
    .eq('funding_status', 'valid'); // guard against race conditions

  if (updateErr) {
    logger.error('[webhook] Error updating certificate funding_status:', updateErr);
  } else {
    const certNumbers = certs.map((c) => c.certificate_number).filter(Boolean);
    logger.info(`[webhook] Flagged ${certIds.length} certificate(s) as funding-refunded: ${certNumbers.join(', ')}`);
  }
}

async function _POST(request: NextRequest) {
  // Resolve per-request — avoids frozen null from module-level cold-start init.
  const supabase = getSupabase();

  // Read secret at request time — module-level init would freeze a missing value permanently.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Stage 0: Log env var presence for debugging
  logger.info('[webhook] Env check:', {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!webhookSecret,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripeInitialized: !!stripe,
    supabaseInitialized: !!supabase,
  });

  if (!webhookSecret) {
    // STRIPE_WEBHOOK_SECRET missing — alert loudly but return 200 so Stripe
    // does not keep retrying. This is a misconfiguration, not a bad request.
    logger.error('[webhook] STRIPE_WEBHOOK_SECRET is not set — event dropped. Set this env var in Netlify immediately.');
    Sentry.captureException(new Error('STRIPE_WEBHOOK_SECRET not set — webhook events are being dropped'), {
      tags: { subsystem: 'stripe_webhook', failure: 'missing_secret' },
    });
    return NextResponse.json({ received: true, warning: 'misconfigured' }, { status: 200 });
  }

  if (!stripe) {
    logger.error('[webhook] Stripe client not initialized — STRIPE_SECRET_KEY missing');
    Sentry.captureException(new Error('Stripe client not initialized in webhook handler'), {
      tags: { subsystem: 'stripe_webhook', failure: 'missing_stripe_client' },
    });
    // Return 200 — misconfiguration, not a bad request. Retrying won't help.
    return NextResponse.json({ received: true, warning: 'stripe_not_configured' }, { status: 200 });
  }

  if (!supabase) {
    logger.error('[webhook] Supabase admin client not initialized — SUPABASE_SERVICE_ROLE_KEY missing');
    Sentry.captureException(new Error('Supabase admin client not initialized in webhook handler'), {
      tags: { subsystem: 'stripe_webhook', failure: 'missing_supabase_client' },
    });
    return NextResponse.json({ received: true, warning: 'db_not_configured' }, { status: 200 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    logger.error('[webhook] No stripe-signature header');
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error('[webhook] Signature verification failed:', err);
    Sentry.captureException(err, {
      tags: { subsystem: 'stripe_webhook', failure: 'signature_verification' },
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ========== SIGNATURE VERIFIED - NEVER RETURN 500 FROM HERE ==========
  // Log verified event details
  logger.info('[webhook] Verified event:', {
    id: event.id,
    type: event.type,
    livemode: event.livemode,
  });

  // Unified event tracking (secondary to stripe_webhook_events)
  claimWebhookEvent('stripe', event.id, event.type, { livemode: event.livemode }).catch(() => {});

  // Wrap ALL post-verify logic in try/catch to prevent 500s
  try {
    // Destructive events: state mutations that must not be replayed.
    // These are fail-closed — if idempotency check fails, skip the mutation.
    // Activation events (checkout.session.completed) are fail-open because
    // upserts make them safely repeatable.
    const DESTRUCTIVE_EVENT_TYPES = new Set([
      'charge.refunded',
      'customer.subscription.deleted',
      'customer.subscription.updated',
      'invoice.payment_failed',
    ]);
    const isDestructive = DESTRUCTIVE_EVENT_TYPES.has(event.type);

    // Idempotency & ordering guarantee:
    // We claim exactly-once side effects per (provider, event_id) because
    // the idempotency record (stripe_webhook_events) is created BEFORE
    // any side effects. Retries short-circuit before mutations. Destructive
    // events (refund, subscription changes) are fail-closed: if we cannot
    // record the event, we skip all mutations and return 200 so Stripe
    // retries on the next attempt.
    let existingEvent = null;
    let idempotencyAvailable = true;
    try {
      const { data } = await supabase
        .from('stripe_webhook_events')
        .select('id, status')
        .eq('stripe_event_id', event.id)
        .single();
      existingEvent = data;
    } catch (idempotencyErr) {
      idempotencyAvailable = false;
      logger.error('[webhook] Idempotency check failed:', idempotencyErr);
      if (isDestructive) {
        logger.error(`[webhook] FAIL-CLOSED: Skipping destructive event ${event.type} (${event.id}) — cannot verify idempotency`);
        Sentry.captureException(idempotencyErr, {
          tags: { subsystem: 'stripe_webhook', failure: 'idempotency_fail_closed', event_type: event.type },
        });
        // Log the failed retry attempt
        try {
          await supabase.from('webhook_retry_log').insert({
            provider: 'stripe', event_id: event.id, event_type: event.type,
            outcome: 'idempotency_failed',
            metadata: { error: String(idempotencyErr) },
          });
        } catch (_) { /* best-effort */ }
        return NextResponse.json({ received: true, skipped: true, reason: 'idempotency_unavailable' });
      }
      // Non-destructive: continue (fail-open)
      logger.warn('[webhook] Continuing without idempotency for non-destructive event');
    }

    if (existingEvent) {
      logger.info(`[webhook] Already processed: ${event.id}, status: ${existingEvent.status}`);
      // Log the duplicate attempt for audit trail
      try {
        await supabase.from('webhook_retry_log').insert({
          provider: 'stripe', event_id: event.id, event_type: event.type,
          outcome: 'duplicate_skipped',
          metadata: { original_status: existingEvent.status },
        });
      } catch (_) { /* best-effort */ }
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Record webhook event before processing.
    // Attempts full insert first (payload + metadata added in migration 20260503000009).
    // Falls back to minimal insert if those columns don't exist yet (42703 = undefined_column).
    let eventRecorded = false;
    try {
      let insertError = (await supabase
        .from('stripe_webhook_events')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          status: 'processing',
          payload: event.data.object,
          metadata: { received_at: new Date().toISOString(), livemode: event.livemode },
        })).error;

      // Column doesn't exist yet (migration pending) — retry without optional columns
      if (insertError?.code === '42703') {
        logger.warn('[webhook] payload/metadata columns missing — retrying minimal insert');
        const fallback = await supabase
          .from('stripe_webhook_events')
          .insert({
            stripe_event_id: event.id,
            event_type: event.type,
            status: 'processing',
          });
        insertError = fallback.error ?? null;
      }

      if (insertError) {
        // Unique constraint = another process is already handling this event
        if (insertError.code === '23505') {
          logger.info(`[webhook] Being processed by another instance: ${event.id}`);
          try {
            await supabase.from('webhook_retry_log').insert({
              provider: 'stripe', event_id: event.id, event_type: event.type,
              outcome: 'duplicate_skipped',
              metadata: { reason: 'unique_constraint_race' },
            });
          } catch (_) { /* best-effort */ }
          return NextResponse.json({ received: true, duplicate: true });
        }
        logger.warn('[webhook] Failed to record event:', insertError);
      } else {
        eventRecorded = true;
      }
    } catch (recordErr) {
      logger.error('[webhook] Record event failed:', recordErr);
    }

    // Fail-closed gate for destructive events: must have recorded the event
    if (isDestructive && !eventRecorded) {
      logger.error(`[webhook] FAIL-CLOSED: Cannot record destructive event ${event.type} (${event.id}) — skipping to prevent duplicate mutations`);
      Sentry.captureException(new Error(`Fail-closed: could not record destructive webhook ${event.type}`), {
        tags: { subsystem: 'stripe_webhook', failure: 'record_fail_closed', event_type: event.type },
      });
      try {
        await supabase.from('webhook_retry_log').insert({
          provider: 'stripe', event_id: event.id, event_type: event.type,
          outcome: 'record_failed',
          metadata: { reason: 'could_not_record_before_mutation' },
        });
      } catch (_) { /* best-effort */ }
      return NextResponse.json({ received: true, skipped: true, reason: 'event_record_failed' });
    }

    // Handle the event - each case wrapped in its own try/catch
    try {
      switch (event.type) {
    case 'checkout.session.completed': {
      // Dispatched to lib/stripe/handlers/checkout-session-completed.ts
      // All checkout.session.completed business logic lives there.
      try {
        await handleCheckoutSessionCompleted(event, { stripe, supabase });
      } catch (err) {
        Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook', event_type: 'checkout.session.completed' } });
        logger.error('[webhook] checkout.session.completed handler error:', err);
      }
      break;
    }

    // Async payment methods (Klarna, Afterpay) confirm funds here, not on session.completed
    case 'checkout.session.async_payment_succeeded': {
      const asyncSession = event.data.object as Stripe.Checkout.Session;
      logger.info('[webhook] Async payment succeeded — processing enrollment', {
        sessionId: asyncSession.id,
        paymentStatus: asyncSession.payment_status,
      });

      // Re-dispatch to the same enrollment logic as checkout.session.completed
      // by constructing a synthetic completed event and recursing through the switch
      // Instead, directly handle the two enrollment paths:

      if (asyncSession.metadata?.kind === 'program_enrollment') {
        const studentId = asyncSession.metadata.student_id;
        const programId = asyncSession.metadata.program_id;
        const programSlug = asyncSession.metadata.program_slug;
        const fundingSource = asyncSession.metadata.funding_source || 'self_pay';
        const amountPaid = (asyncSession.amount_total || 0) / 100;

        if (studentId && programId) {
          const { data: enrollment, error: enrollError } = await supabase
            .from('student_enrollments')
            .upsert({
              student_id: studentId,
              program_id: programId,
              program_slug: programSlug,
              stripe_checkout_session_id: asyncSession.id,
              status: 'active',
              funding_source: fundingSource,
              amount_paid: amountPaid,
              started_at: new Date().toISOString(),
            }, {
              onConflict: 'student_id,program_slug',
            })
            .select('id')
            .single();

          if (enrollError) {
            logger.error('[webhook] Async payment: failed to upsert enrollment', enrollError);
          } else {
            await auditLog({
              action: AuditAction.ENROLLMENT_CREATED,
              entity: AuditEntity.ENROLLMENT,
              entityId: enrollment?.id,
              userId: studentId,
              metadata: {
                program_id: programId,
                program_slug: programSlug,
                funding_source: fundingSource,
                amount_paid: amountPaid,
                checkout_session_id: asyncSession.id,
                payment_method: 'async_bnpl',
                activated_by: 'webhook:async_payment_succeeded',
              },
            });
            logger.info(`✅ Async payment enrollment provisioned: ${programSlug} for ${studentId}`);
          }
        }
      }
      break;
    }

    case 'checkout.session.async_payment_failed': {
      const failedSession = event.data.object as Stripe.Checkout.Session;
      logger.warn('[webhook] Async payment failed', {
        sessionId: failedSession.id,
        customerEmail: failedSession.customer_email,
        metadata: failedSession.metadata,
      });
      // No enrollment to deactivate since we deferred on session.completed
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logger.info('PaymentIntent succeeded:', paymentIntent.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object as Stripe.PaymentIntent;

      // Handle enrollment payment failure
      const enrollmentId = failedPayment.metadata?.enrollment_id;
      if (enrollmentId) {
        try {
          const { error } = await supabase.rpc('fail_stripe_payment', {
            p_enrollment_id: enrollmentId,
            p_stripe_event_id: event.id,
            p_error_message:
              failedPayment.last_payment_error?.message || 'Payment failed',
          });

          if (error) {
            logger.error('Error handling payment failure:', error);
          } else {
            logger.info(
              `✅ Enrollment payment failure handled: ${enrollmentId}`
            );
          }
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error(
            'Error processing payment failure:',
            err instanceof Error ? err : new Error(String(err))
          );
        }
      } else {
        logger.info('Payment failed:', failedPayment.id);
      }
      break;
    }

    // LANE B: Store subscription events
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;

      // Only handle store subscriptions
      if (subscription.metadata?.user_id) {
        try {
          const userId = subscription.metadata.user_id;
          const priceId = subscription.items.data[0]?.price.id;

          if (!priceId) {
            logger.error('No price ID in subscription');
            break;
          }

          // Upsert subscription
          const { data, error }: any = await supabase.rpc(
            'upsert_store_subscription',
            {
              p_user_id: userId,
              p_stripe_subscription_id: subscription.id,
              p_stripe_customer_id: subscription.customer as string,
              p_stripe_price_id: priceId,
              p_status: subscription.status,
              p_cancel_at_period_end: subscription.cancel_at_period_end,
              p_current_period_start: new Date(
                (subscription as any).current_period_start * 1000
              ).toISOString(),
              p_current_period_end: new Date(
                (subscription as any).current_period_end * 1000
              ).toISOString(),
              p_canceled_at: subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000).toISOString()
                : null,
              p_ended_at: subscription.ended_at
                ? new Date(subscription.ended_at * 1000).toISOString()
                : null,
              p_trial_start: subscription.trial_start
                ? new Date(subscription.trial_start * 1000).toISOString()
                : null,
              p_trial_end: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              p_metadata: subscription.metadata,
            }
          );

          if (error) {
            logger.error('Error upserting subscription:', error);
          } else {
            logger.info(
              `✅ Store subscription ${event.type}: ${subscription.id}`
            );
          }
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error(
            'Error processing subscription event:',
            err instanceof Error ? err : new Error(String(err))
          );
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      if (subscription.metadata?.user_id) {
        try {
          const userId = subscription.metadata.user_id;
          const priceId = subscription.items.data[0]?.price.id;

          if (!priceId) {
            logger.error('No price ID in subscription');
            break;
          }

          // Mark subscription as canceled
          const { error } = await supabase.rpc('upsert_store_subscription', {
            p_user_id: userId,
            p_stripe_subscription_id: subscription.id,
            p_stripe_customer_id: subscription.customer as string,
            p_stripe_price_id: priceId,
            p_status: 'canceled',
            p_cancel_at_period_end: false,
            p_current_period_start: new Date(
              (subscription as any).current_period_start * 1000
            ).toISOString(),
            p_current_period_end: new Date(
              (subscription as any).current_period_end * 1000
            ).toISOString(),
            p_canceled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
            p_ended_at: new Date().toISOString(),
            p_trial_start: subscription.trial_start
              ? new Date(subscription.trial_start * 1000).toISOString()
              : null,
            p_trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            p_metadata: subscription.metadata,
          });

          if (error) {
            logger.error('Error canceling subscription:', error);
          } else {
            logger.info(`✅ Store subscription canceled: ${subscription.id}`);
          }
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error(
            'Error processing subscription deletion:',
            err instanceof Error ? err : new Error(String(err))
          );
        }
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;

      // Log successful subscription payment
      if ((invoice as any).subscription) {
        logger.info(
          `✅ Subscription payment succeeded: ${(invoice as any).subscription}`
        );
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;

      // Handle failed subscription payment
      if ((invoice as any).subscription) {
        logger.error(
          `❌ Subscription payment failed: ${(invoice as any).subscription}`
        );

        // Check if this is a license subscription and suspend if needed
        try {
          const { enforceSubscriptionStatus } = await import('@/lib/licensing/provisioning');
          await enforceSubscriptionStatus((invoice as any).subscription);
        } catch (err) {
          logger.error('Error enforcing subscription status:', err);
        }
      }

      // Handle failed apprenticeship installment payment
      // Pause enrollment and lock portal access
      if (invoice.metadata?.kind === 'apprenticeship_enrollment') {
        try {
          const applicationId = invoice.metadata.application_id;
          const studentId = invoice.metadata.student_id;

          logger.info('[webhook] Apprenticeship payment failed, pausing enrollment', {
            applicationId, studentId
          });

          // Update enrollment status to paused
          const { error: pauseError } = await supabase
            .from('program_enrollments')
            .update({
              status: 'paused',
              paused_at: new Date().toISOString(),
              pause_reason: 'payment_failed',
            })
            .eq('application_id', applicationId);

          if (pauseError) {
            logger.error('[webhook] Failed to pause enrollment', pauseError);
          } else {
            logger.warn(`⚠️ Apprenticeship enrollment paused due to payment failure: ${applicationId}`);
            
            // Audit log
            await auditLog({
              action: AuditAction.ENROLLMENT_UPDATED,
              entity: AuditEntity.ENROLLMENT,
              entityId: applicationId,
              userId: studentId,
              metadata: {
                status: 'paused',
                reason: 'payment_failed',
                invoice_id: invoice.id,
              },
            });
          }
        } catch (err) {
          logger.error('[webhook] Error handling apprenticeship payment failure:', err);
        }
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      logger.info('[webhook] Processing refund for charge:', charge.id);

      try {
        // Get payment intent to find metadata
        const paymentIntentId = charge.payment_intent as string;
        if (!paymentIntentId) {
          logger.info('[webhook] No payment intent on charge, skipping');
          break;
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const userId = paymentIntent.metadata?.user_id;
        const productId = paymentIntent.metadata?.product_id;
        const enrollmentId = paymentIntent.metadata?.enrollment_id;
        const programId = paymentIntent.metadata?.program_id;

        if (!userId) {
          logger.info('[webhook] No user_id in payment intent metadata, checking customer');
          // Try to find user by customer ID
          const customerId = charge.customer as string;
          if (customerId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', customerId)
              .single();
            
            if (profile) {
              // Revoke all recent entitlements for this user from this charge
              const { error: revokeError } = await supabase
                .from('store_entitlements')
                .update({ 
                  revoked_at: new Date().toISOString(),
                  revoke_reason: 'refund'
                })
                .eq('user_id', profile.id)
                .eq('stripe_payment_intent_id', paymentIntentId);

              if (revokeError) {
                logger.error('[webhook] Error revoking entitlements:', revokeError);
              } else {
                logger.info('[webhook] Revoked entitlements for refunded charge');
              }

              // Flag certificates for this user as funding-invalid
              await flagCertificatesForRefund(supabase, profile.id, paymentIntentId, charge.id);
            }
          }
          break;
        }

        // Revoke entitlements for this payment
        const { error: revokeError } = await supabase
          .from('store_entitlements')
          .update({ 
            revoked_at: new Date().toISOString(),
            revoke_reason: 'refund'
          })
          .eq('user_id', userId)
          .eq('stripe_payment_intent_id', paymentIntentId);

        if (revokeError) {
          logger.error('[webhook] Error revoking entitlements:', revokeError);
        } else {
          logger.info(`[webhook] Revoked entitlements for user ${userId} due to refund on charge ${charge.id}`);
        }

        // POLICY: Refund reverses funding, not training.
        // A payment reversal is a fiscal event, not an instructional event.
        // The student earned competency; access continues unless an admin
        // explicitly terminates enrollment via a separate action.
        //
        // We update ONLY funding_status. Training status (status column)
        // is untouched. If an admin later decides to terminate, they set
        // status='cancelled' through the admin UI, which requires reason+actor.
        if (enrollmentId) {
          const { error: enrollError } = await supabase
            .from('program_enrollments')
            .update({ 
              funding_status: 'refunded',
              funding_status_changed_at: new Date().toISOString(),
              funding_status_reason: `Stripe charge.refunded: ${charge.id}`,
            })
            .eq('id', enrollmentId);

          if (enrollError) {
            logger.error('[webhook] Error updating enrollment funding_status:', enrollError);
          } else {
            logger.info(`[webhook] Marked enrollment ${enrollmentId} funding_status=refunded (training status unchanged)`);
          }
        }

        // Flag certificates as funding-invalid (not revoked — credential was earned)
        await flagCertificatesForRefund(supabase, userId, paymentIntentId, charge.id, enrollmentId, programId);

        // Revoke LMS access if product grants course access
        if (productId) {
          const { data: product } = await supabase
            .from('store_products')
            .select('grants_course_access, course_id')
            .eq('id', productId)
            .single();

          if (product?.grants_course_access && product.course_id) {
            const { error: lmsError } = await supabase
              .from('course_enrollments')
              .update({ 
                status: 'revoked',
                revoked_at: new Date().toISOString(),
                revoke_reason: 'refund'
              })
              .eq('user_id', userId)
              .eq('course_id', product.course_id);

            if (lmsError) {
              logger.error('[webhook] Error revoking LMS access:', lmsError);
            } else {
              logger.info(`[webhook] Revoked LMS access for course ${product.course_id}`);
            }
          }
        }

        // Cross-provider reconciliation record (post-mutation).
        // Idempotency for Stripe is handled by stripe_webhook_events (pre-mutation).
        // This table is for multi-provider reconciliation reporting only.
        try {
          await supabase.from('webhook_events_processed').insert({
            provider: 'stripe',
            event_id: event.id,
            event_type: event.type,
            payment_reference: paymentIntentId,
            enrollment_id: enrollmentId || null,
            status: 'processed',
            metadata: {
              charge_id: charge.id,
              refund_amount: charge.amount_refunded,
              user_id: userId,
            },
          });
        } catch (logErr) {
          logger.warn('[webhook] Failed to record in webhook_events_processed:', logErr);
        }

        // Flag certificates issued to this student
        await flagCertificatesOnRefund({
          supabase,
          studentId: userId,
          enrollmentId: enrollmentId || undefined,
          reason: 'refunded',
          paymentProvider: 'stripe',
          paymentReference: charge.id,
        });

        // Audit log the refund
        await auditLog({
          action: AuditAction.DELETE,
          entity: AuditEntity.ENTITLEMENT,
          entityId: paymentIntentId,
          userId: userId,
          metadata: {
            charge_id: charge.id,
            refund_amount: charge.amount_refunded,
            reason: 'stripe_refund'
          }
        });

      } catch (err) {
        logger.error('[webhook] Error processing refund:', err);
      }
      break;
    }

      default:
        logger.info(`[webhook] Unhandled event type: ${event.type}`);
        logger.info(`Unhandled event type: ${event.type}`);
      }
    } catch (switchErr) {
      // Event handler threw - log but don't fail
      const errMsg = switchErr instanceof Error ? switchErr.message : String(switchErr);
      const errStack = switchErr instanceof Error ? switchErr.stack : undefined;
      logger.error('[webhook] Event handler error:', errMsg);
      if (errStack) logger.error('[webhook] Stack:', errStack);
      logger.error('Event handler error:', switchErr);
    }

    // Update webhook event status to processed
    try {
      await supabase
        .from('stripe_webhook_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('stripe_event_id', event.id);
      finalizeWebhookEvent('stripe', event.id, 'processed').catch(() => {});
    } catch (updateErr) {
      logger.warn('[webhook] Failed to update status:', updateErr);
      logger.warn('Failed to update webhook status:', updateErr);
    }

  } catch (processingError: any) {
    // Outer catch - something unexpected happened
    const errMsg = processingError instanceof Error ? processingError.message : String(processingError);
    const errStack = processingError instanceof Error ? processingError.stack : undefined;
    logger.error('[webhook] Post-verify error:', errMsg);
    if (errStack) logger.error('[webhook] Stack:', errStack);
    
    // Try to update webhook event status to failed
    try {
      await supabase
        .from('stripe_webhook_events')
        .update({ 
          status: 'failed', 
          error_message: errMsg,
          processed_at: new Date().toISOString() 
        })
        .eq('stripe_event_id', event.id);
      finalizeWebhookEvent('stripe', event.id, 'errored', errMsg).catch(() => {});
    } catch (updateErr) {
      logger.warn('[webhook] Failed to update failure status:', updateErr);
    }

    logger.error('Webhook processing error:', processingError);
  }

  // ALWAYS return 200 after signature verification to stop Stripe retries
  logger.info('[webhook] Returning 200 for event:', event.id);
  return NextResponse.json({ received: true });
}
// skip_body: Stripe body is already consumed by request.text() inside the handler.
// critical omitted: audit failure must not override the 200 returned to Stripe —
// the handler writes its own idempotency records to stripe_webhook_events.
export const POST = withApiAudit('/api/webhooks/stripe', _POST, { actor_type: 'webhook', skip_body: true });
