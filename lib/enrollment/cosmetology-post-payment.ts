/**
 * Cosmetology Apprenticeship — Post-Payment Enrollment Pipeline
 *
 * State machine triggered on checkout.session.completed for cosmetology programs.
 * Mirrors barber-post-payment.ts — runs in order; each step is non-fatal unless marked critical.
 *
 * States written to applications.status:
 *   submitted → paid → approved → onboarding_sent
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import { provisionAccount } from '@/lib/enrollment/provision-account';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const COSMETOLOGY_PROGRAM_SLUG = 'cosmetology-apprenticeship';
const COSMETOLOGY_COURSE_ID = 'b427be5e-c85b-4b41-91d6-4288aec8c975';

export interface CosmetologyPostPaymentInput {
  db: SupabaseClient;
  applicationId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  amountPaidCents: number;
}

export interface CosmetologyPostPaymentResult {
  success: boolean;
  enrollmentId?: string;
  error?: string;
  steps: Record<string, 'ok' | 'skipped' | 'failed'>;
}

export async function runCosmetologyPostPayment(
  input: CosmetologyPostPaymentInput,
): Promise<CosmetologyPostPaymentResult> {
  const { db, applicationId, stripeSessionId, stripePaymentIntentId, amountPaidCents } = input;
  const steps: Record<string, 'ok' | 'skipped' | 'failed'> = {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;

  // ── Step 1: Mark application paid (CRITICAL) ──────────────────────────────
  const { data: app, error: appErr } = await db
    .from('applications')
    .update({
      status: 'ready_to_enroll',
      payment_status: 'paid',
      payment_intent_id: stripePaymentIntentId ?? null,
      payment_received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select('id, email, first_name, last_name, phone, status, enrollment_id')
    .maybeSingle();

  if (appErr || !app) {
    logger.error('[cosmetology-post-payment] Step 1 failed: application update', undefined, {
      applicationId,
      error: appErr?.message,
    });
    return { success: false, error: `Application update failed: ${appErr?.message}`, steps };
  }
  steps['mark_paid'] = 'ok';

  const studentEmail = app.email;
  const studentName = [app.first_name, app.last_name].filter(Boolean).join(' ') || studentEmail;
  const firstName = app.first_name || 'there';

  // ── Step 2: Find or create profile + program_enrollment (CRITICAL) ──────
  let enrollmentId: string | undefined = app.enrollment_id ?? undefined;

  if (!enrollmentId) {
    // Ensure a profile exists — provision one if not (creates account + sends credentials email)
    let profileId: string | null = null;
    const { data: existingProfile } = await db
      .from('profiles')
      .select('id')
      .eq('email', studentEmail.toLowerCase().trim())
      .maybeSingle();

    if (existingProfile?.id) {
      profileId = existingProfile.id;
      steps['provision_account'] = 'skipped';
    } else {
      const provision = await provisionAccount({
        db,
        email: studentEmail,
        fullName: studentName,
        phone: app.phone ?? null,
        programName: 'Cosmetology Apprenticeship',
        programSlug: COSMETOLOGY_PROGRAM_SLUG,
        postLoginUrl: `${siteUrl}/apprentice`,
      });
      if (provision.error || !provision.userId) {
        logger.error('[cosmetology-post-payment] Account provisioning failed', undefined, { error: provision.error });
        steps['provision_account'] = 'failed';
      } else {
        profileId = provision.userId;
        steps['provision_account'] = 'ok';
      }
    }

    if (!profileId) {
      logger.warn('[cosmetology-post-payment] No profile — enrollment deferred', { studentEmail });
      steps['create_enrollment'] = 'skipped';
    } else {
      const { data: program } = await db
        .from('programs')
        .select('id')
        .eq('slug', COSMETOLOGY_PROGRAM_SLUG)
        .maybeSingle();

      if (!program?.id) {
        logger.error('[cosmetology-post-payment] Cosmetology program not found in programs table');
        steps['create_enrollment'] = 'failed';
      } else {
        const { data: existing } = await db
          .from('program_enrollments')
          .select('id')
          .eq('user_id', profileId)
          .eq('program_id', program.id)
          .maybeSingle();

        if (existing?.id) {
          enrollmentId = existing.id;
          steps['create_enrollment'] = 'skipped';
        } else {
          const { data: newEnrollment, error: enrollErr } = await db
            .from('program_enrollments')
            .insert({
              student_id: profileId,
              user_id: profileId,
              program_id: program.id,
              program_slug: COSMETOLOGY_PROGRAM_SLUG,
              course_id: COSMETOLOGY_COURSE_ID,
              email: studentEmail,
              full_name: studentName,
              phone: app.phone ?? null,
              status: 'active',
              enrollment_state: 'enrolled',
              funding_source: 'self_pay',
              amount_paid_cents: amountPaidCents,
              stripe_checkout_session_id: stripeSessionId,
              stripe_payment_intent_id: stripePaymentIntentId ?? null,
              enrolled_at: new Date().toISOString(),
            })
            .select('id')
            .maybeSingle();

          if (enrollErr || !newEnrollment) {
            logger.error('[cosmetology-post-payment] Enrollment creation failed', undefined, {
              error: enrollErr?.message,
            });
            steps['create_enrollment'] = 'failed';
          } else {
            enrollmentId = newEnrollment.id;
            steps['create_enrollment'] = 'ok';
          }
        }

        if (enrollmentId) {
          await db
            .from('applications')
            .update({
              enrollment_id: enrollmentId,
              status: 'approved',
              updated_at: new Date().toISOString(),
            })
            .eq('id', applicationId);
        }
      }
    }
  } else {
    steps['create_enrollment'] = 'skipped';
  }

  // ── Step 3: Create follow-up reminder for admin ───────────────────────────
  try {
    const { data: lead } = await db
      .from('crm_leads')
      .select('id')
      .eq('email', studentEmail.toLowerCase().trim())
      .maybeSingle();

    await db.from('follow_up_reminders').insert({
      due_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      type: 'enrollment-followup',
      lead_id: lead?.id ?? null,
      application_id: applicationId,
      note: `Paid cosmetology student ${studentName} (${studentEmail}) — confirm host shop and start date.`,
    });

    if (lead?.id) {
      await db
        .from('crm_leads')
        .update({
          stage: 'paid_awaiting_approval',
          priority: 'urgent',
          self_pay_interest: true,
          application_id: applicationId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);
    }

    steps['crm_reminder'] = 'ok';
  } catch (err) {
    logger.error('[cosmetology-post-payment] CRM reminder failed (non-fatal)', err);
    steps['crm_reminder'] = 'failed';
  }

  // ── Step 4: Welcome + credentials email ──────────────────────────────────
  // provisionAccount already sends this for new users.
  // For existing users (profile already existed), send enrollment confirmation now.
  if (steps['provision_account'] === 'skipped') {
    try {
      await provisionAccount({
        db,
        email: studentEmail,
        fullName: studentName,
        phone: app.phone ?? null,
        programName: 'Cosmetology Apprenticeship',
        programSlug: COSMETOLOGY_PROGRAM_SLUG,
        postLoginUrl: `${siteUrl}/apprentice`,
      });
      steps['student_email'] = 'ok';
    } catch (err) {
      logger.warn('[cosmetology-post-payment] Enrollment confirmation email failed (non-fatal)', err);
      steps['student_email'] = 'failed';
    }
  } else {
    steps['student_email'] = steps['provision_account'] === 'ok' ? 'ok' : 'skipped';
  }

  try {
    await db
      .from('applications')
      .update({ onboarding_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', applicationId);
  } catch { /* non-fatal */ }

  // ── Step 5: Send internal admin notification ───────────────────────────────
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');
    const adminUrl = `${siteUrl}/admin/applications`;

    await sendEmail({
      to: 'elevate4humanityedu@gmail.com',
      from: '${PLATFORM_DEFAULTS.orgName} <${PLATFORM_DEFAULTS.emailFromAddress}>',
      replyTo: 'elevate4humanityedu@gmail.com',
      subject: `New Enrollment: ${studentName} — Cosmetology Apprenticeship`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#dc2626;padding:20px 28px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-weight:700;font-size:16px;">New Cosmetology Apprenticeship Enrollment</p>
  </div>
  <div style="padding:28px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <p style="margin:0 0 16px;font-size:15px;">A cosmetology apprenticeship student has paid and is ready to start.</p>
    <table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0;width:140px;">Student Name</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;">${studentName}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0;">Email</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;">${studentEmail}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0;">Phone</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;">${app.phone || 'Not provided'}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0;">Program</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;">Cosmetology Apprenticeship</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0;">Payment</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#16a34a;font-weight:700;">✅ Paid — $${(amountPaidCents / 100).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0;">Onboarding</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#16a34a;">✅ Email sent to student</td>
      </tr>
    </table>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-weight:700;color:#dc2626;">Required Actions:</p>
      <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;">
        <li style="margin-bottom:6px;">Confirm host shop placement at Mesmerized by Beauty within 1–2 business days</li>
        <li style="margin-bottom:0;">Contact student to confirm start date</li>
      </ol>
    </div>
    <p style="text-align:center;">
      <a href="${adminUrl}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;">
        View in Admin Portal →
      </a>
    </p>
  </div>
</div>`,
    });

    steps['admin_email'] = 'ok';
  } catch (err) {
    logger.error('[cosmetology-post-payment] Admin notification email failed (non-fatal)', err);
    steps['admin_email'] = 'failed';
  }

  logger.info('[cosmetology-post-payment] Pipeline complete', { applicationId, enrollmentId, steps });

  return { success: true, enrollmentId, steps };
}
