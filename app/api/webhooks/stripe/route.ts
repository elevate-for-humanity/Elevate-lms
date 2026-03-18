// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin';
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
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { createEnrollmentCase, submitCaseForSignatures } from '@/lib/workflow/case-management';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { createOrUpdateEnrollment, linkOrphanedEnrollments } from '@/lib/enrollment-service';
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



// Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Flag certificates as funding-invalid when a refund occurs.
 * Does NOT delete or revoke the credential — the student earned it.
 * Sets funding_status='refunded' so downstream systems (ETPL, WIOA reports)
 * know the payment backing this credential was reversed.
 */
async function flagCertificatesForRefund(
  db: ReturnType<typeof createClient>,
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
  db: ReturnType<typeof createClient>,
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
  // Read secret at request time — module-level init would freeze a missing value permanently.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Stage 0: Log env var presence for debugging
  logger.info('[webhook] Env check:', {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!webhookSecret,
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    stripeInitialized: !!stripe,
    supabaseInitialized: !!supabase,
  });

  if (!webhookSecret) {
    logger.error('[webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  if (!stripe || !supabase) {
    logger.error('[webhook] Missing config:', { stripe: !!stripe, supabase: !!supabase });
    return NextResponse.json(
      { error: 'Stripe or Supabase not configured' },
      { status: 503 }
    );
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

    // Record webhook event before processing
    let eventRecorded = false;
    try {
      const { error: insertError } = await supabase
        .from('stripe_webhook_events')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          status: 'processing',
          payload: event.data.object,
          metadata: { received_at: new Date().toISOString() },
        });

      if (insertError) {
        // If insert fails due to unique constraint, another process is handling it
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
      const session = event.data.object as Stripe.Checkout.Session;

      // Guard: Only activate enrollment when funds are confirmed.
      // 'paid' = card/instant capture. 'no_payment_required' = WIOA/free/trial.
      // 'unpaid' = async methods (Klarna, Afterpay) — deferred to async_payment_succeeded.
      // Any unknown status is also deferred as a safety measure.
      const allowedPaymentStatuses = ['paid', 'no_payment_required'];
      if (!allowedPaymentStatuses.includes(session.payment_status)) {
        logger.info('[webhook] Payment not yet confirmed — deferring enrollment', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          paymentMethodTypes: session.payment_method_types,
        });
        break;
      }

      // ========== CANONICAL PROGRAM ENROLLMENT ==========
      // This is the standard path for ALL program enrollments
      if (session.metadata?.kind === 'program_enrollment') {
        try {
          const studentId = session.metadata.student_id;
          const programId = session.metadata.program_id;
          const programSlug = session.metadata.program_slug;
          const fundingSource = session.metadata.funding_source || 'self_pay';
          const amountPaid = (session.amount_total || 0) / 100;

          if (!studentId || !programId) {
            logger.error('[webhook] program_enrollment missing required metadata', {
              studentId, programId, programSlug
            });
            break;
          }

          logger.info('[webhook] Processing program_enrollment', {
            studentId, programId, programSlug, fundingSource, amountPaid
          });

          // UPSERT student_enrollments - idempotent on (student_id, program_slug)
          // Safe against Stripe retries and double-submissions
          const { data: enrollment, error: enrollError } = await supabase
            .from('student_enrollments')
            .upsert({
              student_id: studentId,
              program_id: programId,
              program_slug: programSlug,
              stripe_checkout_session_id: session.id,
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
            logger.error('[webhook] Failed to upsert student_enrollment', enrollError);
          } else {
            logger.info('[webhook] student_enrollment created/updated', { 
              enrollmentId: enrollment?.id,
              studentId,
              programSlug 
            });

            // Audit log
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
                checkout_session_id: session.id,
              },
            });
          }

          logger.info(`✅ Program enrollment provisioned: ${programSlug} for student ${studentId}`);
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error('[webhook] Error processing program_enrollment:', err);
          logger.error('Error processing program_enrollment:', err instanceof Error ? err : new Error(String(err)));
        }
        break;
      }

      // ========== DONATION PROCESSING ==========
      if (session.metadata?.type === 'donation') {
        try {
          const amount = parseFloat(session.metadata.amount || '0');
          const donorEmail = session.customer_email || session.customer_details?.email;

          await supabase.from('donations').insert({
            stripe_session_id: session.id,
            amount: amount,
            donor_email: donorEmail,
            status: 'completed',
            created_at: new Date().toISOString(),
          });

          logger.info(`✅ Donation recorded: $${amount} from ${donorEmail || 'anonymous'}`);
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error('[webhook] Error processing donation:', err);
        }
        break;
      }

      // ========== EXTERNAL COURSE PURCHASE (STUDENT SELF-PAY) ==========
      // Student paid for a partner-hosted external course.
      // Record the completion row and email login credentials to the student.
      // Login instructions are stored on the external_course_completions row by staff
      // after they purchase on the partner site; the system emails them automatically
      // when staff saves the record (see admin approval route).
      if (session.metadata?.kind === 'external_course_purchase') {
        try {
          const studentId       = session.metadata.student_id;
          const externalCourseId = session.metadata.external_course_id;
          const programId       = session.metadata.program_id;
          const studentEmail    = session.metadata.student_email || session.customer_email;
          const partnerName     = session.metadata.partner_name;
          const courseTitle     = session.metadata.course_title;
          const programSlug     = session.metadata.program_slug;

          if (!studentId || !externalCourseId || !programId) {
            logger.error('[webhook] external_course_purchase missing metadata', session.metadata);
            break;
          }

          // Upsert completion row — not yet complete, just purchased
          const { data: completion, error: upsertErr } = await supabase
            .from('external_course_completions')
            .upsert(
              {
                user_id:            studentId,
                external_course_id: externalCourseId,
                program_id:         programId,
                completed_at:       null,
                stripe_session_id:  session.id,
              },
              { onConflict: 'user_id,external_course_id' },
            )
            .select('id')
            .single();

          if (upsertErr) {
            logger.error('[webhook] external_course_purchase upsert failed', upsertErr);
          } else {
            logger.info(`✅ External course purchase recorded: ${courseTitle} for ${studentId}`);
          }

          // Alert staff to purchase on partner site and enter login credentials
          try {
            const { sendAdminExternalCoursePurchaseAlert } = await import('@/lib/email/external-course');
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', studentId)
              .maybeSingle();

            const { data: course } = await supabase
              .from('program_external_courses')
              .select('external_url')
              .eq('id', externalCourseId)
              .maybeSingle();

            const { data: program } = await supabase
              .from('programs')
              .select('title')
              .eq('id', programId)
              .maybeSingle();

            await sendAdminExternalCoursePurchaseAlert({
              courseTitle:    courseTitle ?? 'External Course',
              partnerName:    partnerName ?? 'Partner',
              partnerUrl:     course?.external_url ?? '#',
              studentName:    profile?.full_name ?? 'Student',
              studentEmail:   studentEmail ?? '',
              programTitle:   program?.title ?? programSlug ?? '',
              completionId:   completion?.id ?? '',
            });
          } catch (emailErr) {
            logger.error('[webhook] Failed to send admin purchase alert', emailErr);
          }
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error('[webhook] Error processing external_course_purchase:', err);
        }
        break;
      }

      // ========== APPRENTICESHIP ENROLLMENT (SELF-PAY) ==========
      // Payment moves student from applied → enrolled_pending_approval
      // Training access unlocks ONLY after admin approval (→ active)
      if (session.metadata?.kind === 'apprenticeship_enrollment') {
        try {
          const studentId = session.metadata.student_id;
          const applicationId = session.metadata.application_id;
          const program = session.metadata.program;
          const paymentOption = session.metadata.payment_option;
          const amountPaid = (session.amount_total || 0) / 100;

          if (!studentId || !applicationId) {
            logger.error('[webhook] apprenticeship_enrollment missing required metadata', {
              studentId, applicationId, program, paymentOption
            });
            break;
          }

          logger.info('[webhook] Processing apprenticeship_enrollment', {
            studentId, applicationId, program, paymentOption, amountPaid
          });

          // Update application status
          const { error: appError } = await supabase
            .from('applications')
            .update({ 
              status: 'payment_received',
              payment_received_at: new Date().toISOString(),
            })
            .eq('id', applicationId);

          if (appError) {
            logger.error('[webhook] Failed to update application', appError);
          }

          // Create or update enrollment with enrolled_pending_approval status
          // CRITICAL: Status is NOT 'active' - training access is locked
          const { data: enrollment, error: enrollError } = await supabase
            .from('program_enrollments')
            .upsert({
              user_id: studentId,
              application_id: applicationId,
              program_slug: program === 'barber_apprenticeship' ? 'barber-apprenticeship' : program,
              status: 'enrolled_pending_approval', // NOT active - requires admin approval
              payment_status: 'paid',
              payment_option: paymentOption,
              amount_paid: amountPaid,
              stripe_checkout_session_id: session.id,
              enrolled_at: new Date().toISOString(),
            }, {
              onConflict: 'application_id',
            })
            .select('id')
            .single();

          if (enrollError) {
            logger.error('[webhook] Failed to create enrollment', enrollError);
          } else {
            logger.info('[webhook] Apprenticeship enrollment created', {
              enrollmentId: enrollment?.id,
              status: 'enrolled_pending_approval',
              studentId,
              program
            });

            // Audit log
            await auditLog({
              action: AuditAction.ENROLLMENT_CREATED,
              entity: AuditEntity.ENROLLMENT,
              entityId: enrollment?.id,
              userId: studentId,
              metadata: {
                program,
                payment_option: paymentOption,
                amount_paid: amountPaid,
                checkout_session_id: session.id,
                enrollment_flow: 'apprenticeship_self_pay',
                status: 'enrolled_pending_approval',
              },
            });
          }

          // Update payment log
          await supabase
            .from('payment_logs')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('stripe_session_id', session.id);

          logger.info(`✅ Apprenticeship enrollment created (pending approval): ${program} for student ${studentId}`);

          // Link any other orphaned enrollments for this customer
          const customerEmail = session.customer_email || session.customer_details?.email;
          if (customerEmail) {
            await linkOrphanedEnrollments(supabase, customerEmail).catch(() => {});
          }
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error('[webhook] Error processing apprenticeship_enrollment:', err);
          logger.error('Error processing apprenticeship_enrollment:', err instanceof Error ? err : new Error(String(err)));
        }
        break;
      }

      // LANE 0: Handle TRIAL-TO-SUBSCRIPTION UPGRADE
      if (session.metadata?.upgrade_from === 'trial' && session.mode === 'subscription') {
        try {
          const tenantId = session.metadata.tenant_id;
          const previousLicenseId = session.metadata.previous_license_id;
          const newTier = session.metadata.new_tier;
          const subscriptionId = session.subscription as string;

          if (!tenantId || !previousLicenseId || !newTier) {
            logger.error('[webhook] Trial upgrade missing required metadata', {
              tenantId, previousLicenseId, newTier
            });
            break;
          }

          logger.info('[webhook] Processing trial-to-subscription upgrade', {
            tenantId, previousLicenseId, newTier, subscriptionId
          });

          // Get subscription details from Stripe for current_period_end
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

          // 1. Create new subscription license
          const { data: newLicense, error: createError } = await supabase
            .from('licenses')
            .insert({
              tenant_id: tenantId,
              tier: newTier,
              status: 'active',
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
              current_period_end: currentPeriodEnd,
              // No expires_at for subscription tiers - controlled by current_period_end
              expires_at: null,
              metadata: {
                upgraded_from_license: previousLicenseId,
                upgraded_at: new Date().toISOString(),
                checkout_session_id: session.id,
              },
            })
            .select()
            .single();

          if (createError) {
            logger.error('[webhook] Failed to create subscription license', createError);
            break;
          }

          logger.info('[webhook] Created subscription license', { newLicenseId: newLicense.id });

          // 2. Mark trial license as expired
          const { error: expireError } = await supabase
            .from('licenses')
            .update({
              status: 'expired',
              expires_at: new Date().toISOString(),
              metadata: {
                upgraded_to_license: newLicense.id,
                expired_reason: 'upgraded_to_subscription',
              },
            })
            .eq('id', previousLicenseId);

          if (expireError) {
            logger.error('[webhook] Failed to expire trial license', expireError);
            // Don't break - new license is created, this is non-critical
          }

          // 3. Update subscription metadata with new license ID
          await stripe.subscriptions.update(subscriptionId, {
            metadata: {
              ...subscription.metadata,
              license_id: newLicense.id,
            },
          });

          logger.info('[webhook] Trial upgrade complete', {
            tenantId,
            oldLicenseId: previousLicenseId,
            newLicenseId: newLicense.id,
            tier: newTier,
          });

          // Audit log
          await auditLog({
            action: AuditAction.LICENSE_UPGRADED,
            entity: AuditEntity.LICENSE,
            entityId: newLicense.id,
            userId: session.metadata.user_id || null,
            metadata: {
              previous_license_id: previousLicenseId,
              previous_tier: session.metadata.previous_tier,
              new_tier: newTier,
              subscription_id: subscriptionId,
            },
          });

        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error('[webhook] Error processing trial upgrade:', err);
          logger.error('Error processing trial upgrade:', err instanceof Error ? err : new Error(String(err)));
        }
        break;
      }

      // ========== CANONICAL PROGRAM ENROLLMENT ==========
      // This is the single provisioning path for ALL program enrollments
      // Metadata contract: kind='program_enrollment', program_id, student_id, program_slug, funding_source
      if (session.metadata?.kind === 'program_enrollment') {
        try {
          const programId = session.metadata.program_id;
          const studentId = session.metadata.student_id;
          const programSlug = session.metadata.program_slug;
          const fundingSource = session.metadata.funding_source || 'self_pay';

          if (!programId || !studentId) {
            logger.error('[webhook] Program enrollment missing required metadata', {
              programId, studentId, programSlug
            });
            break;
          }

          logger.info('[webhook] Processing program enrollment', {
            programId, studentId, programSlug, fundingSource,
            amountTotal: session.amount_total,
          });

          // UPSERT student_enrollments - canonical enrollment table
          const { data: enrollment, error: enrollError } = await supabase
            .from('student_enrollments')
            .upsert({
              student_id: studentId,
              program_id: programId,
              program_slug: programSlug,
              stripe_checkout_session_id: session.id,
              status: 'active',
              amount_paid: (session.amount_total || 0) / 100,
              funding_source: fundingSource,
              enrolled_at: new Date().toISOString(),
            }, {
              onConflict: 'stripe_checkout_session_id',
            })
            .select('id')
            .single();

          if (enrollError) {
            // Check if it's a duplicate (already processed)
            if (enrollError.code === '23505') {
              logger.info('[webhook] Enrollment already exists (duplicate webhook)', { sessionId: session.id });
            } else {
              logger.error('[webhook] Failed to create enrollment', enrollError);
              logger.error('Failed to create student enrollment:', enrollError);
            }
          } else {
            logger.info('[webhook] Student enrollment created', { 
              enrollmentId: enrollment?.id,
              programSlug,
              studentId,
            });

            // Audit log (non-critical)
            try {
              await auditLog({
                actorId: studentId,
                actorRole: 'student',
                action: AuditAction.ENROLLMENT_CREATED,
                entity: AuditEntity.ENROLLMENT,
                entityId: enrollment?.id,
                metadata: {
                  program_id: programId,
                  program_slug: programSlug,
                  funding_source: fundingSource,
                  amount_paid: (session.amount_total || 0) / 100,
                  checkout_session_id: session.id,
                },
              });
            } catch (auditErr) {
              logger.warn('[webhook] Failed to create audit log (non-critical):', auditErr);
            }

            logger.info(`✅ Program enrollment provisioned: ${programSlug} for student ${studentId}`);
          }

          // Log payment (non-critical - don't fail enrollment if this fails)
          try {
            await supabase.from('payment_logs').insert({
              stripe_session_id: session.id,
              stripe_payment_id: session.payment_intent as string,
              amount: (session.amount_total || 0) / 100,
              currency: 'usd',
              status: 'completed',
              metadata: {
                kind: 'program_enrollment',
                program_id: programId,
                program_slug: programSlug,
                student_id: studentId,
                funding_source: fundingSource,
              },
            });
          } catch (logErr) {
            logger.warn('[webhook] Failed to log payment (non-critical):', logErr);
          }

        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error('[webhook] Error processing program enrollment:', err);
          logger.error('Error processing program enrollment:', err instanceof Error ? err : new Error(String(err)));
        }
        break;
      }

      // LANE A: Handle LICENSE purchase (platform license)
      if (session.metadata?.product_type === 'license') {
        try {
          const { provisionLicense } = await import('@/lib/licensing/provisioning');
          
          const result = await provisionLicense({
            licenseType: (session.metadata.license_type as 'basic' | 'professional' | 'enterprise') || 'basic',
            companyName: session.metadata.company_name || 'Unknown Company',
            adminEmail: session.customer_email || session.metadata.admin_email || '',
            companyDomain: session.metadata.company_domain,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string || undefined,
            paymentType: session.mode === 'subscription' ? 'subscription' : 'one_time',
          });

          if (result.success) {
            logger.info(`✅ License provisioned: ${result.tenantId} for ${session.metadata.company_name}`);
          } else {
            logger.error(`❌ License provisioning failed: ${result.error}`);
          }
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error('Error provisioning license:', err instanceof Error ? err : new Error(String(err)));
        }
        break;
      }

      // LANE B: Handle store subscription checkout
      if (
        session.mode === 'subscription' &&
        session.metadata?.subscription_type === 'store'
      ) {
        try {
          const userId = session.metadata.user_id;

          if (!userId) {
            logger.error('No user_id in subscription checkout metadata');
            break;
          }

          // Subscription will be created by customer.subscription.created event
          // Just log the checkout completion here
          logger.info(
            `✅ Store subscription checkout completed: ${session.id}`
          );
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error(
            'Error processing store subscription checkout:',
            err instanceof Error ? err : new Error(String(err))
          );
        }
        break;
      }

      // LANE A: Handle enrollment payment checkout
      if (
        session.mode === 'payment' &&
        session.metadata?.payment_type === 'enrollment'
      ) {
        try {
          const enrollmentId = session.metadata.enrollment_id;

          if (!enrollmentId) {
            logger.error('No enrollment_id in payment checkout metadata');
            break;
          }

          // Complete enrollment payment using RPC
          const { data, error }: any = await supabase.rpc(
            'complete_enrollment_payment',
            {
              p_enrollment_id: enrollmentId,
              p_stripe_event_id: event.id,
              p_stripe_session_id: session.id,
              p_stripe_payment_intent_id: session.payment_intent as string,
              p_amount_cents: session.amount_total || 0,
            }
          );

          if (error) {
            logger.error('Error completing enrollment payment:', error);
          } else if (data?.duplicate) {
            logger.info(`⚠️ Duplicate enrollment webhook ignored: ${event.id}`);
          } else {
            logger.info(`✅ Enrollment payment completed: ${enrollmentId}`);
          }
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error(
            'Error processing enrollment payment:',
            err instanceof Error ? err : new Error(String(err))
          );
        }
        break;
      }

      // LANE C: Handle CAREER COURSE purchase
      if (session.metadata?.type === 'career_course') {
        try {
          const courseIds = session.metadata.course_ids?.split(',') || [];
          const customerEmail = session.customer_email || session.customer_details?.email;
          const promoCode = session.metadata.promo_code;

          // Get user by email
          let userId: string | null = null;
          if (customerEmail) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', customerEmail)
              .single();
            userId = profile?.id || null;
          }

          // Record purchases for each course
          for (const courseId of courseIds) {
            const { error } = await supabase
              .from('career_course_purchases')
              .upsert({
                user_id: userId,
                course_id: courseId,
                email: customerEmail || '',
                amount_paid: (session.amount_total || 0) / 100 / courseIds.length,
                stripe_payment_id: session.payment_intent as string,
                stripe_session_id: session.id,
                status: 'completed',
                purchased_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,course_id',
              });

            if (error) {
              logger.error('Error recording career course purchase:', error);
            }
          }

          // Record promo code use if applicable
          if (promoCode) {
            const { data: promo } = await supabase
              .from('promo_codes')
              .select('id')
              .eq('code', promoCode)
              .single();

            if (promo) {
              await supabase.from('promo_code_uses').insert({
                promo_code_id: promo.id,
                user_id: userId,
                email: customerEmail,
                order_id: session.id,
                discount_amount: ((session.amount_subtotal || 0) - (session.amount_total || 0)) / 100,
              });
            }
          }

          // Send welcome email
          if (customerEmail) {
            try {
              const { getWelcomeEmail } = await import('@/lib/email/career-course-sequences');
              const { data: courseData } = await supabase
                .from('career_courses')
                .select('title, slug')
                .in('id', courseIds)
                .limit(1)
                .single();

              if (courseData) {
                const emailContent = getWelcomeEmail({
                  email: customerEmail,
                  courseName: courseData.title,
                  courseSlug: courseData.slug,
                  purchaseDate: new Date().toISOString(),
                });

                await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: customerEmail,
                    subject: emailContent.subject,
                    html: emailContent.html,
                  }),
                });
              }
            } catch (emailErr) {
              logger.error('Error sending career course welcome email:', emailErr);
            }
          }

          logger.info(`✅ Career course purchase completed: ${courseIds.join(', ')}`);
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error('Error processing career course purchase:', err);
        }
        break;
      }

      // Handle drug testing products and training courses
      if (
        session.metadata?.type === 'service' ||
        session.metadata?.type === 'course'
      ) {
        try {
          // Log the purchase
          const { error: logError } = await supabase
            .from('payment_logs')
            .insert({
              stripe_session_id: session.id,
              stripe_payment_id: session.payment_intent as string,
              amount: (session.amount_total || 0) / 100,
              currency: 'usd',
              status: 'completed',
              metadata: {
                productName: session.metadata.productName,
                type: session.metadata.type,
                category: session.metadata.category,
                price: session.metadata.price,
                customer_email: session.customer_email,
              },
            });

          if (logError) {
            logger.error('Error logging drug testing purchase:', logError);
          }

          // Create order record
          const { error: orderError } = await supabase
            .from('drug_testing_orders')
            .insert({
              product_name: session.metadata.productName,
              product_type: session.metadata.type,
              category: session.metadata.category,
              price: parseFloat(session.metadata.price || '0'),
              customer_email: session.customer_email,
              stripe_session_id: session.id,
              stripe_payment_id: session.payment_intent as string,
              status: 'pending_contact',
              created_at: new Date().toISOString(),
            });

          if (orderError) {
            logger.error('Error creating drug testing order:', orderError);
          } else {
            logger.info(
              '✅ Drug testing order created:',
              session.metadata.productName
            );
          }

          // Send confirmation email to customer

          // Send notification to admin
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error(
            'Error processing drug testing purchase:',
            err instanceof Error ? err : new Error(String(err))
          );
        }
        break;
      }

      // Handle barber apprenticeship enrollment
      if (session.metadata?.programSlug === 'barber-apprenticeship') {
        try {
          const applicationId = session.metadata.applicationId;
          const transferHours = parseInt(session.metadata.transferHours || '0', 10);
          const customerName = session.metadata.customerName;
          const customerPhone = session.metadata.customerPhone;
          const hasHostShop = session.metadata.hasHostShop;
          const hostShopName = session.metadata.hostShopName;
          
          // Update application status to paid if applicationId exists
          if (applicationId) {
            const { error: appError } = await supabase
              .from('applications')
              .update({
                status: 'paid',
                payment_completed_at: new Date().toISOString(),
                stripe_session_id: session.id,
                transfer_hours: transferHours,
              })
              .eq('id', applicationId);

            if (appError) {
              logger.error('Error updating barber application:', appError);
            }
          }

          // Update RAPIDS registration status
          await supabase
            .from('rapids_registrations')
            .update({
              status: 'active',
              payment_completed_at: new Date().toISOString(),
            })
            .eq('application_id', applicationId);

          // Get application or create enrollment directly from checkout metadata
          let application = null;
          if (applicationId) {
            const { data } = await supabase
              .from('applications')
              .select('*')
              .eq('id', applicationId)
              .single();
            application = data;
          }

          // If no application but we have customer info from metadata, create enrollment directly
          const customerEmail = session.customer_email || session.customer_details?.email;
          
          if (application || customerEmail) {
            // Get or create user profile
            let userId = application?.user_id;
            const email = application?.email || customerEmail;
            const fullName = application 
              ? `${application.first_name} ${application.last_name}`
              : customerName || 'Unknown';
            
            if (!userId && email) {
              // Check if profile exists
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();
              
              if (existingProfile) {
                userId = existingProfile.id;
              } else {
                // Create profile for new user
                const { data: profile } = await supabase
                  .from('profiles')
                  .insert({
                    email,
                    full_name: fullName,
                    phone: application?.phone || customerPhone || null,
                    role: 'student',
                  })
                  .select('id')
                  .single();
                
                userId = profile?.id;
              }
            }

            if (userId) {
              // Determine funding_source from metadata, default to self_pay for paid transactions
              const barberFundingSource = session.metadata?.funding_source || 
                ((session.amount_total || 0) > 0 ? 'self_pay' : 'unknown');

              // Idempotent upsert on (student_id, program_slug)
              const { data: enrollment } = await supabase.from('student_enrollments').upsert({
                student_id: userId,
                program_slug: 'barber-apprenticeship',
                stripe_checkout_session_id: session.id,
                status: 'active',
                region_id: 'IN',
                funding_source: barberFundingSource,
                amount_paid: (session.amount_total || 0) / 100,
                transfer_hours: transferHours || 0,
                has_host_shop: hasHostShop === 'yes',
                host_shop_name: hostShopName || null,
              }, {
                onConflict: 'student_id,program_slug',
              }).select('id').single();

              // Create enrollment case (case spine) for workflow automation
              const enrollmentCase = await createEnrollmentCase({
                studentId: userId,
                programSlug: 'barber-apprenticeship',
                programType: 'apprenticeship',
                regionId: 'IN',
                fundingSource: barberFundingSource,
                signaturesRequired: ['student', 'employer', 'program_holder'],
              });

              if (enrollmentCase && enrollment) {
                // Link enrollment to case
                await supabase.from('student_enrollments')
                  .update({ case_id: enrollmentCase.id })
                  .eq('id', enrollment.id);

                // Transition case to pending_signatures
                await submitCaseForSignatures(enrollmentCase.id, userId);

                logger.info('✅ Enrollment case created:', enrollmentCase.case_number);
              }

              // Audit log: enrollment created
              await auditLog({
                actorId: userId,
                actorRole: 'student',
                action: AuditAction.ENROLLMENT_CREATED,
                entity: AuditEntity.ENROLLMENT,
                entityId: enrollment?.id,
                metadata: {
                  program_slug: 'barber-apprenticeship',
                  case_id: enrollmentCase?.id,
                  case_number: enrollmentCase?.case_number,
                  payment_amount: (session.amount_total || 0) / 100,
                },
              });

              // Provision Milady access — $295 vendor payment + student credentials
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('email, first_name, last_name, full_name, phone')
                  .eq('id', userId)
                  .single();

                if (profile) {
                  const { purchaseMiladyCourse } = await import('@/lib/vendors/milady-purchase');
                  const miladyResult = await purchaseMiladyCourse(
                    {
                      id: userId,
                      email: profile.email,
                      firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'Student',
                      lastName: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
                      phone: profile.phone || undefined,
                    },
                    'barber-apprenticeship',
                    session.payment_intent as string
                  );

                  if (miladyResult.success) {
                    logger.info('✅ Milady provisioned for student:', userId);
                  } else {
                    logger.warn('[webhook] Milady provisioning queued for manual setup:', userId);
                  }
                }
              } catch (miladyErr) {
                // Non-fatal: enrollment succeeds even if Milady provisioning fails
                logger.error('[webhook] Milady provisioning error (non-fatal):', miladyErr instanceof Error ? miladyErr : new Error(String(miladyErr)));
              }
            }
          }

          // Log payment
          await supabase.from('payment_logs').insert({
            stripe_session_id: session.id,
            stripe_payment_id: session.payment_intent as string,
            amount: (session.amount_total || 0) / 100,
            currency: 'usd',
            status: 'completed',
            metadata: {
              programSlug: 'barber-apprenticeship',
              applicationId,
              type: 'apprenticeship',
            },
          });

          // Audit log: payment processed
          await auditLog({
            actorRole: 'system',
            action: AuditAction.PAYMENT_PROCESSED,
            entity: AuditEntity.PAYMENT,
            entityId: session.id,
            metadata: {
              amount: (session.amount_total || 0) / 100,
              program_slug: 'barber-apprenticeship',
              application_id: applicationId,
            },
          });

          logger.info('✅ Barber apprenticeship enrollment completed:', applicationId);
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error(
            'Error processing barber apprenticeship enrollment:',
            err instanceof Error ? err : new Error(String(err))
          );
        }
        break;
      }

      // Check if this is a partner course enrollment (new system)
      if (session.metadata?.course_id && session.metadata?.provider_id) {
        try {
          // Determine funding_source from metadata, default to self_pay for paid transactions
          const fundingSource = session.metadata.funding_source || 
            ((session.amount_total || 0) > 0 ? 'self_pay' : 'unknown');

          // Create partner enrollment record
          const { data: partnerEnrollment, error: enrollmentError } = await supabase
            .from('partner_lms_enrollments')
            .insert({
              provider_id: session.metadata.provider_id,
              student_id: session.metadata.student_id,
              course_id: session.metadata.course_id,
              status: 'active',
              payment_status: 'paid',
              payment_amount: (session.amount_total || 0) / 100,
              payment_session_id: session.id,
              payment_completed_at: new Date().toISOString(),
              course_name: session.metadata.course_code,
              funding_source: fundingSource,
              metadata: {
                wholesale_cost: session.metadata.wholesale_cost,
                retail_price: session.metadata.retail_price,
                profit_margin: session.metadata.profit_margin,
                course_url: session.metadata.course_url,
              },
            })
            .select('id')
            .single();

          if (enrollmentError) {
            logger.error('Error creating partner enrollment:', enrollmentError);
          } else {
            logger.info(
              '✅ Partner course enrollment created:',
              session.metadata.course_code
            );
          }

          // Log payment
          await supabase.from('payment_logs').insert({
            stripe_session_id: session.id,
            stripe_payment_id: session.payment_intent as string,
            amount: (session.amount_total || 0) / 100,
            currency: 'usd',
            status: 'completed',
            metadata: session.metadata,
          });

          logger.info('✅ Partner course payment logged');

          // --- Vendor Payout: pay vendor wholesale cost, keep margin ---
          const wholesaleCostCents = Math.round(parseFloat(session.metadata.wholesale_cost || '0') * 100);
          const retailPriceCents = Math.round(parseFloat(session.metadata.retail_price || '0') * 100);

          if (wholesaleCostCents > 0 && partnerEnrollment?.id) {
            try {
              const { processVendorPayout } = await import('@/lib/vendors/payout');
              const payoutResult = await processVendorPayout({
                enrollmentId: partnerEnrollment.id,
                courseId: session.metadata.course_id,
                providerId: session.metadata.provider_id,
                providerName: session.metadata.provider_name || 'Unknown',
                wholesaleCostCents,
                retailPriceCents,
                stripePaymentIntentId: session.payment_intent as string,
                studentId: session.metadata.student_id,
                studentEmail: session.metadata.student_email || '',
                courseName: session.metadata.course_code || 'Partner Course',
              });
              logger.info(`✅ Vendor payout ${payoutResult.method}: $${(wholesaleCostCents / 100).toFixed(2)} to ${session.metadata.provider_name}`);
            } catch (payoutErr) {
              // Non-fatal: enrollment succeeds even if payout recording fails
              logger.error('[webhook] Vendor payout error (non-fatal):', payoutErr instanceof Error ? payoutErr : new Error(String(payoutErr)));
            }
          }

          // --- Credential Delivery: send student login/access info ---
          if (partnerEnrollment?.id) {
            try {
              const { deliverCredentials } = await import('@/lib/vendors/credential-delivery');
              const deliveryResult = await deliverCredentials({
                enrollmentId: partnerEnrollment.id,
                courseId: session.metadata.course_id,
                courseName: session.metadata.course_code || 'Partner Course',
                courseCode: session.metadata.course_code,
                providerId: session.metadata.provider_id,
                providerName: session.metadata.provider_name || 'Unknown',
                providerType: session.metadata.provider_type || 'generic',
                studentId: session.metadata.student_id,
                studentEmail: session.metadata.student_email || session.customer_email || '',
                studentName: session.metadata.student_name || 'Student',
                courseUrl: session.metadata.course_url,
              });
              logger.info(`✅ Credential delivery ${deliveryResult.method} for ${session.metadata.student_email}`);
            } catch (deliveryErr) {
              // Non-fatal: enrollment succeeds even if credential delivery fails
              logger.error('[webhook] Credential delivery error (non-fatal):', deliveryErr instanceof Error ? deliveryErr : new Error(String(deliveryErr)));
            }
          }
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error(
            'Error processing partner course enrollment:',
            err instanceof Error ? err : new Error(String(err))
          );
        }
        break;
      }

      // Check if this is an HSI enrollment (legacy system)
      if (session.metadata?.provider === 'hsi') {
        try {
          // Get course details
          const { data: course } = await supabase
            .from('hsi_course_products')
            .select('*')
            .eq('course_type', session.metadata.course_type)
            .single();

          if (!course) {
            logger.error('HSI course not found:', session.metadata.course_type);
            break;
          }

          // Determine funding_source from metadata, default to self_pay for paid transactions
          const hsiFundingSource = session.metadata.funding_source || 
            ((session.amount_total || 0) > 0 ? 'self_pay' : 'unknown');

          // Create enrollment queue entry
          const { error: queueError } = await supabase
            .from('hsi_enrollment_queue')
            .insert({
              student_id: session.metadata.student_id,
              course_type: session.metadata.course_type,
              stripe_payment_id: session.payment_intent as string,
              stripe_session_id: session.id,
              amount_paid: (session.amount_total || 0) / 100,
              student_email: session.metadata.student_email,
              student_name: session.metadata.student_name,
              student_phone: session.metadata.student_phone || '',
              student_address: session.metadata.student_address || '',
              hsi_enrollment_link: course.hsi_enrollment_link,
              enrollment_status: 'pending',
              funding_source: hsiFundingSource,
            });

          if (queueError) {
            logger.error('Error creating HSI enrollment queue:', queueError);
          } else {
            logger.info(
              '✅ HSI enrollment queued:',
              session.metadata.student_name
            );
          }

          // Create partner enrollment record
          const { data: provider } = await supabase
            .from('partner_lms_providers')
            .select('id')
            .eq('provider_type', 'hsi')
            .single();

          if (provider) {
            await supabase.from('partner_lms_enrollments').insert({
              provider_id: provider.id,
              student_id: session.metadata.student_id,
              status: 'payment_pending',
              payment_status: 'paid',
              payment_amount: (session.amount_total || 0) / 100,
              payment_session_id: session.id,
              payment_completed_at: new Date().toISOString(),
              course_name: course.course_name,
              funding_source: hsiFundingSource,
            });
          }

          // Log payment
          await supabase.from('payment_logs').insert({
            stripe_session_id: session.id,
            stripe_payment_id: session.payment_intent as string,
            amount: (session.amount_total || 0) / 100,
            currency: 'usd',
            status: 'completed',
            metadata: session.metadata,
          });

          logger.info('✅ HSI payment logged successfully');
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error(
            'Error processing HSI enrollment:',
            err instanceof Error ? err : new Error(String(err))
          );
        }
        break;
      }

      // Handle regular course enrollments (LANE A: Tuition/Enrollment)
      const enrollmentId = session.metadata?.enrollment_id;

      if (enrollmentId) {
        try {
          // Use idempotent payment completion function
          const { data, error }: any = await supabase.rpc(
            'complete_stripe_payment',
            {
              p_enrollment_id: enrollmentId,
              p_stripe_event_id: event.id,
              p_stripe_session_id: session.id,
              p_stripe_payment_intent_id: session.payment_intent as string,
              p_amount_cents: session.amount_total || 0,
            }
          );

          if (error) {
            logger.error('Error completing enrollment payment:', error);
          } else if (data?.duplicate) {
            logger.info(`⚠️ Duplicate webhook ignored: ${event.id}`);
          } else {
            logger.info(`✅ Enrollment payment completed: ${enrollmentId}`);
          }
        } catch (err: any) {
          Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } });
          logger.error(
            'Error processing enrollment payment:',
            err instanceof Error ? err : new Error(String(err))
          );
        }
        break;
      }

      // Legacy fallback for old enrollments without enrollment_id
      const userId = session.metadata?.user_id;
      const courseId = session.metadata?.course_id;
      const partnerOwedCents = parseInt(
        session.metadata?.partner_owed_cents || '0',
        10
      );
      const yourRevenueCents = parseInt(
        session.metadata?.your_revenue_cents || '0',
        10
      );

      if (userId && courseId) {
        // Determine funding_source from metadata, default to self_pay for paid transactions
        const legacyFundingSource = session.metadata?.funding_source || 
          ((session.amount_total || 0) > 0 ? 'self_pay' : 'unknown');

        // Idempotent upsert (legacy path) — safe against webhook retries
        await supabase.from('program_enrollments').upsert({
          user_id: userId,
          course_id: courseId,
          status: 'active',
          payment_status: 'paid',
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          paid_at: new Date().toISOString(),
          amount_paid_cents: session.amount_total || 0,
          enrollment_type: 'standalone',
          funding_source: legacyFundingSource,
          partner_owed_cents: partnerOwedCents,
          your_revenue_cents: yourRevenueCents,
        }, {
          onConflict: 'stripe_checkout_session_id',
        });

        // Create partner payment record if applicable
        if (partnerOwedCents > 0) {
          const { data: course } = await supabase
            .from('training_courses')
            .select('partner_id')
            .eq('id', courseId)
            .single();

          if (course?.partner_id) {
            await supabase.from('partner_course_payments').insert({
              enrollment_id: enrollmentId,
              course_id: courseId,
              partner_id: course.partner_id,
              student_paid_cents: session.amount_total || 0,
              partner_owed_cents: partnerOwedCents,
              your_revenue_cents: yourRevenueCents,
              status: 'pending',
              due_date: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            });
          }
        }

        logger.info(
          `✅ Payment processed (legacy): user ${userId}, course ${courseId}`
        );

        // Link any other orphaned enrollments for this customer in case
        // they paid for multiple programs before verifying their account.
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (customerEmail) {
          await linkOrphanedEnrollments(supabase, customerEmail).catch(() => {});
        }
        break;
      }

      // ========================================================================
      // PAYMENT LINK FALLBACK HANDLER
      // For Payment Links without metadata - infer enrollment from price mapping
      // ========================================================================
      try {
        // Log diagnostic info
        const hasMetadata = !!(session.metadata?.payment_type || session.metadata?.enrollment_id || session.metadata?.program_id);
        logger.info('[webhook] Payment Link fallback check:', {
          session_id: session.id,
          has_metadata: hasMetadata,
          payment_type: session.metadata?.payment_type || 'none',
          mode: session.mode,
        });

        // Skip if we already have proper metadata (handled above)
        if (hasMetadata) {
          logger.info('[webhook] Session has metadata, skipping fallback');
          break;
        }

        // Only process payment mode sessions (not subscriptions)
        if (session.mode !== 'payment') {
          logger.info('[webhook] Not a payment session, skipping fallback');
          break;
        }

        // Fetch line items from Stripe to get price/product IDs
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          limit: 10,
        });

        if (!lineItems.data.length) {
          logger.info('[webhook] No line items found, skipping fallback');
          break;
        }

        // Get the first line item's price and product
        const firstItem = lineItems.data[0];
        const priceId = firstItem.price?.id || null;
        const productId = typeof firstItem.price?.product === 'string' 
          ? firstItem.price.product 
          : firstItem.price?.product?.id || null;

        logger.info('[webhook] Payment Link fallback - line item:', {
          price_id: priceId,
          product_id: productId,
          amount: firstItem.amount_total,
        });

        if (!priceId && !productId) {
          logger.info('[webhook] No price or product ID, skipping fallback');
          break;
        }

        // Look up enrollment mapping in database
        const { data: mapping, error: mappingError } = await supabase.rpc(
          'lookup_stripe_enrollment_map',
          {
            p_price_id: priceId,
            p_product_id: productId,
          }
        );

        if (mappingError) {
          logger.error('[webhook] Mapping lookup error:', mappingError);
          break;
        }

        if (!mapping || mapping.length === 0) {
          logger.info('[webhook] Payment Link - no enrollment mapping:', {
            session_id: session.id,
            has_metadata: false,
            price_id: priceId,
            product_id: productId,
            mapping_hit: false,
            enrollment_result: 'skipped:no_mapping',
          });
          break;
        }

        const enrollmentConfig = mapping[0];
        logger.info('[webhook] Found enrollment mapping:', {
          program_slug: enrollmentConfig.program_slug,
          enrollment_type: enrollmentConfig.enrollment_type,
          is_deposit: enrollmentConfig.is_deposit,
          auto_enroll: enrollmentConfig.auto_enroll,
        });

        // Skip if auto-enroll is disabled for this mapping
        if (!enrollmentConfig.auto_enroll) {
          logger.info('[webhook] Auto-enroll disabled for this mapping');
          break;
        }

        // Get customer email
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (!customerEmail) {
          logger.info('[webhook] No customer email, cannot create enrollment');
          break;
        }

        // Find or create user profile
        let studentId: string | null = null;
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail.toLowerCase())
          .single();

        if (existingProfile) {
          studentId = existingProfile.id;
        } else {
          // Create a new profile for the student
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              email: customerEmail.toLowerCase(),
              full_name: session.customer_details?.name || customerEmail.split('@')[0],
              role: 'student',
              onboarding_completed: false,
            })
            .select('id')
            .single();

          if (profileError) {
            logger.error('[webhook] Failed to create profile:', profileError);
            break;
          }
          studentId = newProfile?.id || null;
        }

        if (!studentId) {
          logger.error('[webhook] Could not determine student ID');
          break;
        }

        // Get program ID from training_programs table
        const { data: program } = await supabase
          .from('training_programs')
          .select('id')
          .eq('slug', enrollmentConfig.program_slug)
          .single();

        const programId = program?.id || enrollmentConfig.program_id;

        // Canonical enrollment write via enrollment service
        const enrollResult = await createOrUpdateEnrollment(supabase, {
          studentId,
          programId,
          programSlug: enrollmentConfig.program_slug,
          fundingSource: enrollmentConfig.funding_source || 'SELF_PAY',
          isDeposit: enrollmentConfig.is_deposit,
          amountPaidCents: session.amount_total || 0,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
        });

        if (enrollResult.error) {
          logger.error('[webhook] Enrollment service error:', enrollResult.error);
          break;
        }

        const enrollmentResult = `${enrollResult.action}:${enrollResult.id}`;

        // Log the successful enrollment
        logger.info('[webhook] ✅ Payment Link enrollment processed:', {
          session_id: session.id,
          price_id: priceId,
          mapping_hit: true,
          enrollment_result: enrollmentResult,
          program_slug: enrollmentConfig.program_slug,
          student_email: customerEmail,
        });

        // Send welcome email if configured
        if (enrollmentConfig.send_welcome_email && customerEmail) {
          try {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
            await fetch(`${siteUrl}/api/email/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: customerEmail,
                subject: `🎓 Welcome to ${enrollmentConfig.program_slug.replace(/-/g, ' ')} - Enrollment Confirmed!`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1e3a8a;">Welcome to Elevate for Humanity!</h2>
                    <p>Your enrollment has been confirmed.</p>
                    <p><strong>Program:</strong> ${enrollmentConfig.program_slug.replace(/-/g, ' ')}</p>
                    <p><strong>Status:</strong> ${enrollmentConfig.is_deposit ? 'Deposit Paid - Remaining balance due' : 'Fully Paid'}</p>
                    <div style="text-align: center; margin: 24px 0;">
                      <a href="${siteUrl}/login" style="display: inline-block; background: #ea580c; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to Student Portal →</a>
                    </div>
                    <p>Questions? Call us at <a href="tel:3173143757">(317) 314-3757</a></p>
                  </div>
                `,
              }),
            });
            logger.info('[webhook] Welcome email sent to:', customerEmail);
          } catch (emailErr) {
            logger.warn('[webhook] Failed to send welcome email:', emailErr);
          }
        }

      } catch (fallbackErr) {
        // Don't fail the webhook for fallback errors
        logger.error('[webhook] Payment Link fallback error (non-fatal):', fallbackErr);
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
