/**
 * Handler: checkout.session.completed
 *
 * Dispatches to sub-handlers by session.metadata.kind.
 * Each sub-handler is responsible for exactly one enrollment path.
 *
 * The full business logic from the original 2,492-line webhook is preserved
 * here — this file is a direct extraction, not a rewrite. The only changes
 * are: (a) it receives supabase/stripe via context instead of module-level
 * globals, and (b) it uses createOrUpdateEnrollment() for the canonical
 * program_enrollment path instead of a raw upsert.
 */

import type Stripe from 'stripe';
import type { StripeEventHandler } from './types';
import {
  createOrUpdateEnrollment,
  linkOrphanedEnrollments,
  normalizeFundingSource,
} from '@/lib/enrollment-service';
import { runBarberPostPayment } from '@/lib/enrollment/barber-post-payment';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const handleCheckoutSessionCompleted: StripeEventHandler = async (
  event,
  { supabase, stripe },
) => {
  const session = event.data.object as Stripe.Checkout.Session;

  // Only activate enrollment when funds are confirmed.
  // 'unpaid' = async methods (Klarna, Afterpay) — deferred to async_payment_succeeded.
  const allowedPaymentStatuses = ['paid', 'no_payment_required'];
  if (!allowedPaymentStatuses.includes(session.payment_status ?? '')) {
    logger.info('[webhook/checkout] Payment not yet confirmed — deferring', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
    });
    return;
  }

  const kind = session.metadata?.kind;

  // ── CANONICAL PROGRAM ENROLLMENT ──────────────────────────────────────────
  if (kind === 'program_enrollment') {
    try {
      const userId = session.metadata?.student_id ?? session.metadata?.user_id;
      const programId = session.metadata?.program_id;
      const programSlug = session.metadata?.program_slug;
      const fundingSource = session.metadata?.funding_source ?? 'self_pay';
      const amountPaidCents = session.amount_total ?? 0;
      const customerEmail =
        session.customer_email ?? session.customer_details?.email ?? undefined;

      if (!userId || !programId) {
        logger.error('[webhook/checkout] program_enrollment missing required metadata', {
          userId,
          programId,
          programSlug,
        });
        return;
      }

      const result = await createOrUpdateEnrollment(supabase, {
        userId,
        programId,
        programSlug,
        fundingSource,
        amountPaidCents,
        stripeCheckoutSessionId: session.id,
        email: customerEmail,
      });

      if (result.error) {
        logger.error('[webhook/checkout] createOrUpdateEnrollment failed', result.error);
        return;
      }

      await auditLog({
        action: AuditAction.ENROLLMENT_CREATED,
        entity: AuditEntity.ENROLLMENT,
        entityId: result.id,
        userId,
        metadata: {
          program_id: programId,
          program_slug: programSlug,
          funding_source: normalizeFundingSource(fundingSource),
          amount_paid_cents: amountPaidCents,
          checkout_session_id: session.id,
          action: result.action,
        },
      });

      logger.info(`[webhook/checkout] program_enrollment ${result.action}: ${programSlug} for ${userId}`);

      // Send enrollment confirmation email
      if (customerEmail && result.action !== 'already_active') {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, full_name')
            .eq('id', userId)
            .maybeSingle();

          const firstName =
            profile?.first_name ?? profile?.full_name?.split(' ')[0] ?? 'there';
          const programTitle = (programSlug ?? '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
          const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
          const isDeposit = amountPaidCents < 500_000; // < $5,000 = deposit

          await fetch(`${siteUrl}/api/email/send`, {
            method: 'POST',
            headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.CRON_SECRET ?? '',
      },
            body: JSON.stringify({
              to: customerEmail,
              subject: `Enrollment confirmed — ${programTitle}`,
              html: buildEnrollmentEmail({ firstName, programTitle, siteUrl, isDeposit }),
            }),
          });
        } catch (emailErr) {
          logger.error('[webhook/checkout] Enrollment confirmation email failed', emailErr);
        }
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook', kind } });
      logger.error('[webhook/checkout] Error processing program_enrollment:', err);
    }
    return;
  }

  // ── DONATION ──────────────────────────────────────────────────────────────
  if (session.metadata?.type === 'donation') {
    try {
      const amount = parseFloat(session.metadata.amount ?? '0');
      const donorEmail =
        session.customer_email ?? session.customer_details?.email;

      await supabase.from('donations').insert({
        stripe_session_id: session.id,
        amount,
        donor_email: donorEmail,
        status: 'completed',
        created_at: new Date().toISOString(),
      });

      logger.info(`[webhook/checkout] Donation recorded: $${amount} from ${donorEmail ?? 'anonymous'}`);
    } catch (err) {
      Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook', kind: 'donation' } });
      logger.error('[webhook/checkout] Error processing donation:', err);
    }
    return;
  }

  // ── EXTERNAL COURSE PURCHASE ───────────────────────────────────────────────
  if (kind === 'external_course_purchase') {
    try {
      const studentId = session.metadata?.student_id;
      const externalCourseId = session.metadata?.external_course_id;
      const programId = session.metadata?.program_id;
      const studentEmail =
        session.metadata?.student_email ?? session.customer_email ?? undefined;
      const partnerName = session.metadata?.partner_name;
      const courseTitle = session.metadata?.course_title;
      const programSlug = session.metadata?.program_slug;

      if (!studentId || !externalCourseId || !programId) {
        logger.error('[webhook/checkout] external_course_purchase missing metadata', session.metadata);
        return;
      }

      const { data: completion, error: upsertErr } = await supabase
        .from('external_course_completions')
        .upsert(
          {
            user_id: studentId,
            external_course_id: externalCourseId,
            program_id: programId,
            completed_at: null,
            stripe_session_id: session.id,
          },
          { onConflict: 'user_id,external_course_id' },
        )
        .select('id')
        .single();

      if (upsertErr) {
        logger.error('[webhook/checkout] external_course_purchase upsert failed', upsertErr);
      } else {
        logger.info(`[webhook/checkout] External course purchase recorded: ${courseTitle} for ${studentId}`);
      }

      try {
        const { sendAdminExternalCoursePurchaseAlert } = await import(
          '@/lib/email/external-course'
        );
        const [{ data: profile }, { data: course }, { data: program }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', studentId).maybeSingle(),
          supabase.from('program_external_courses').select('external_url').eq('id', externalCourseId).maybeSingle(),
          supabase.from('programs').select('title').eq('id', programId).maybeSingle(),
        ]);

        await sendAdminExternalCoursePurchaseAlert({
          courseTitle: courseTitle ?? 'External Course',
          partnerName: partnerName ?? 'Partner',
          partnerUrl: course?.external_url ?? '#',
          studentName: profile?.full_name ?? 'Student',
          studentEmail: studentEmail ?? '',
          programTitle: program?.title ?? programSlug ?? '',
          completionId: completion?.id ?? '',
        });
      } catch (emailErr) {
        logger.error('[webhook/checkout] Failed to send admin purchase alert', emailErr);
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook', kind } });
      logger.error('[webhook/checkout] Error processing external_course_purchase:', err);
    }
    return;
  }

  // ── APPRENTICESHIP ENROLLMENT (SELF-PAY) ──────────────────────────────────
  // Delegates to runBarberPostPayment which handles: application status update,
  // program_enrollments upsert, CRM reminder, student welcome email, and
  // The old inline upsert here was missing enrollment emails and LMS access —
  // that was the root cause of deposit-paid-but-no-access bugs.
  if (kind === 'apprenticeship_enrollment') {
    try {
      const applicationId = session.metadata?.application_id;
      const amountPaidCents = session.amount_total ?? 0;
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null;

      if (!applicationId) {
        logger.error('[webhook/checkout] apprenticeship_enrollment missing application_id', {
          sessionId: session.id,
          metadata: session.metadata,
        });
        return;
      }

      const result = await runBarberPostPayment({
        db: supabase,
        applicationId,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        amountPaidCents,
      });

      if (!result.success) {
        logger.error('[webhook/checkout] runBarberPostPayment failed', {
          applicationId,
          error: result.error,
          steps: result.steps,
        });
        Sentry.captureException(new Error(`runBarberPostPayment failed: ${result.error}`), {
          tags: { subsystem: 'stripe_webhook', kind },
          extra: { applicationId, steps: result.steps },
        });
      } else {
        logger.info('[webhook/checkout] apprenticeship_enrollment pipeline complete', {
          applicationId,
          enrollmentId: result.enrollmentId,
          steps: result.steps,
        });
      }

      // Mark payment_logs completed regardless of pipeline outcome
      await supabase
        .from('payment_logs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('stripe_session_id', session.id);

      const customerEmail = session.customer_email ?? session.customer_details?.email;
      if (customerEmail) {
        await linkOrphanedEnrollments(supabase, customerEmail).catch(() => {});
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook', kind } });
      logger.error('[webhook/checkout] Error processing apprenticeship_enrollment:', err);
    }
    return;
  }

  // ── UNRECOGNISED KIND — log and no-op ─────────────────────────────────────
  logger.info('[webhook/checkout] Unrecognised session kind — no-op', {
    sessionId: session.id,
    kind,
    mode: session.mode,
  });
};

// ── Email template ─────────────────────────────────────────────────────────

function buildEnrollmentEmail({
  firstName,
  programTitle,
  siteUrl,
  isDeposit,
}: {
  firstName: string;
  programTitle: string;
  siteUrl: string;
  isDeposit: boolean;
}): string {
  return `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1e293b">
  <div style="background:#1e293b;padding:24px 32px">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Career &amp; Technical Institute</p>
  </div>
  <div style="padding:32px">
    <h1 style="margin:0 0 16px;font-size:22px">You're enrolled, ${firstName}!</h1>
    <p style="color:#475569;line-height:1.6;margin:0 0 8px">
      Your payment has been received and your enrollment in <strong>${programTitle}</strong> is confirmed.
    </p>
    ${
      isDeposit
        ? `<p style="color:#d97706;font-size:13px;margin:0 0 16px">
        <strong>Deposit received.</strong> Your remaining balance will be due before your program start date.
        We will contact you with payment instructions.
      </p>`
        : ''
    }
    <p style="color:#475569;line-height:1.6;margin:0 0 24px">
      Your next step is to complete onboarding — it takes about 10 minutes and unlocks your coursework.
    </p>
    <a href="${siteUrl}/onboarding/learner"
       style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px">
      Complete Onboarding →
    </a>
    <div style="margin:32px 0 0;padding:20px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
      <p style="margin:0 0 8px;font-weight:700;font-size:14px">What happens next:</p>
      <ol style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:2">
        <li>Complete your onboarding profile and documents</li>
        <li>Watch the orientation video</li>
        <li>Start your first lesson — work at your own pace</li>
        <li>Earn your certification on-site at Elevate</li>
      </ol>
    </div>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">
      Questions? Call <strong>(317) 314-3757</strong> or reply to this email.<br>
      Elizabeth Greene — Director, Elevate for Humanity Career &amp; Technical Institute
    </p>
  </div>
</div>`;
}
