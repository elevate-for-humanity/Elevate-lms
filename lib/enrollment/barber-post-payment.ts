/**
 * Barber Apprenticeship — Post-Payment Enrollment Pipeline
 *
 * State machine triggered on checkout.session.completed for barber programs.
 * Runs in order; each step is non-fatal unless marked critical.
 *
 * States written to applications.status:
 *   submitted → paid → approved → onboarding_sent
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const BARBER_PROGRAM_SLUG = 'barber-apprenticeship';
const BARBER_COURSE_ID    = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

export interface BarberPostPaymentInput {
  db: SupabaseClient;
  applicationId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  amountPaidCents: number;
}

export interface BarberPostPaymentResult {
  success: boolean;
  enrollmentId?: string;
  error?: string;
  steps: Record<string, 'ok' | 'skipped' | 'failed'>;
}

export async function runBarberPostPayment(
  input: BarberPostPaymentInput,
): Promise<BarberPostPaymentResult> {
  const { db, applicationId, stripeSessionId, stripePaymentIntentId, amountPaidCents } = input;
  const steps: Record<string, 'ok' | 'skipped' | 'failed'> = {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

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
    .single();

  if (appErr || !app) {
    logger.error('[barber-post-payment] Step 1 failed: application update', { applicationId, error: appErr?.message });
    return { success: false, error: `Application update failed: ${appErr?.message}`, steps };
  }
  steps['mark_paid'] = 'ok';

  const studentEmail = app.email;
  const studentName  = [app.first_name, app.last_name].filter(Boolean).join(' ') || studentEmail;
  const firstName    = app.first_name || 'there';

  // ── Step 2: Find or create program_enrollment (CRITICAL) ─────────────────
  let enrollmentId: string | undefined = app.enrollment_id ?? undefined;

  if (!enrollmentId) {
    // Find profile by email
    const { data: profile } = await db
      .from('profiles')
      .select('id')
      .eq('email', studentEmail.toLowerCase().trim())
      .maybeSingle();

    if (!profile?.id) {
      // No profile yet — enrollment will be created on admin approval when profile exists
      logger.warn('[barber-post-payment] No profile found for paid application — enrollment deferred', { studentEmail });
      steps['create_enrollment'] = 'skipped';
    } else {
      const profileId = profile.id;

      // Find the barber program — program_enrollments.program_id FK references apprenticeship_programs
      const { data: program } = await db
        .from('apprenticeship_programs')
        .select('id')
        .eq('slug', BARBER_PROGRAM_SLUG)
        .maybeSingle();

      if (!program?.id) {
        logger.error('[barber-post-payment] Barber program not found in apprenticeship_programs table');
        steps['create_enrollment'] = 'failed';
      } else {
        // Upsert enrollment
        const { data: existing } = await db
          .from('program_enrollments')
          .select('id')
          .eq('student_id', profileId)
          .eq('program_id', program.id)
          .maybeSingle();

        if (existing?.id) {
          enrollmentId = existing.id;
          steps['create_enrollment'] = 'skipped'; // already exists
        } else {
          const { data: newEnrollment, error: enrollErr } = await db
            .from('program_enrollments')
            .insert({
              student_id:                  profileId,
              user_id:                     profileId,
              program_id:                  program.id,
              program_slug:                BARBER_PROGRAM_SLUG,
              course_id:                   BARBER_COURSE_ID,
              email:                       studentEmail,
              full_name:                   studentName,
              phone:                       app.phone ?? null,
              // Payment received — hold at pending_review until admin grants access.
              status:                      'pending_review',
              enrollment_state:            'enrolled',
              funding_source:              'self_pay',
              amount_paid_cents:           amountPaidCents,
              stripe_checkout_session_id:  stripeSessionId,
              stripe_payment_intent_id:    stripePaymentIntentId ?? null,
              enrolled_at:                 new Date().toISOString(),
            })
            .select('id')
            .single();

          if (enrollErr || !newEnrollment) {
            logger.error('[barber-post-payment] Enrollment creation failed', { error: enrollErr?.message });
            steps['create_enrollment'] = 'failed';
          } else {
            enrollmentId = newEnrollment.id;
            steps['create_enrollment'] = 'ok';
          }
        }

        // Link enrollment back to application
        if (enrollmentId) {
          await db
            .from('applications')
            .update({ enrollment_id: enrollmentId, status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', applicationId);
        }
      }
    }
  } else {
    steps['create_enrollment'] = 'skipped'; // already linked
  }

  // ── Step 3: Create follow-up reminder for admin ───────────────────────────
  try {
    // Find CRM lead
    const { data: lead } = await db
      .from('crm_leads')
      .select('id')
      .eq('email', studentEmail.toLowerCase().trim())
      .maybeSingle();

    await db.from('follow_up_reminders').insert({
      due_at:         new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
      status:         'pending',
      type:           'enrollment-followup',
      lead_id:        lead?.id ?? null,
      application_id: applicationId,
      note:           `Paid barber student ${studentName} (${studentEmail}) — confirm host shop and start date.`,
    });

    // Advance CRM lead stage
    if (lead?.id) {
      await db
        .from('crm_leads')
        .update({
          stage:             'paid_awaiting_approval',
          priority:          'urgent',
          self_pay_interest: true,
          application_id:    applicationId,
          updated_at:        new Date().toISOString(),
        })
        .eq('id', lead.id);
    }

    steps['crm_reminder'] = 'ok';
  } catch (err) {
    logger.error('[barber-post-payment] CRM reminder failed (non-fatal)', err);
    steps['crm_reminder'] = 'failed';
  }

  // ── Step 4: Send student welcome + onboarding email ───────────────────────
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');
    const onboardingUrl = `${siteUrl}/onboarding/barber-apprenticeship`;
    const dashboardUrl  = `${siteUrl}/learner/dashboard`;
    const loginUrl      = `${siteUrl}/login`;

    await sendEmail({
      to: studentEmail,
      subject: "You're enrolled — start your Barber Apprenticeship onboarding",
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Barber Apprenticeship Program</p>
  </div>
  <div style="padding:32px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">Welcome, ${firstName}. Your enrollment is confirmed.</h1>
    <p style="color:#475569;margin:0 0 24px;">Payment received. Here's everything you need to get started today.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:0 0 16px;">
      <h3 style="margin:0 0 12px;color:#166534;font-size:15px;">Step 1 — Complete Your Onboarding</h3>
      <p style="margin:0 0 16px;color:#374151;font-size:14px;">Takes about 10 minutes. Unlocks your coursework and training schedule.</p>
      <p style="text-align:center;">
        <a href="${onboardingUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          Start Onboarding →
        </a>
      </p>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:0 0 16px;">
      <h3 style="margin:0 0 12px;color:#1e40af;font-size:15px;">Step 2 — Access Your Student Portal</h3>
      <p style="margin:0 0 16px;color:#374151;font-size:14px;">Your student dashboard is ready. Track your hours, coursework, and progress.</p>
      <p style="text-align:center;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          Go to Student Portal →
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;margin:8px 0 0;text-align:center;">
        Log in at <a href="${loginUrl}" style="color:#2563eb;">${loginUrl}</a>
      </p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#0f172a;font-size:14px;">Your checklist:</p>
      <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;">
        <li style="margin-bottom:6px;">Complete onboarding (10 min)</li>
        <li style="margin-bottom:6px;">Log in to your student portal</li>
        <li style="margin-bottom:0;">Your advisor will contact you within 1–2 business days to confirm your host shop and start date</li>
      </ol>
    </div>

    <p style="color:#475569;font-size:14px;">
      Questions? Call <a href="tel:3173143757" style="color:#ea580c;font-weight:700;">317-314-3757</a> or email
      <a href="mailto:info@elevateforhumanity.org" style="color:#ea580c;">info@elevateforhumanity.org</a>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
      Elevate for Humanity · 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240
    </p>
  </div>
</div>`,
    });

    // Mark onboarding email sent
    await db
      .from('applications')
      .update({ onboarding_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    steps['student_email'] = 'ok';
  } catch (err) {
    logger.error('[barber-post-payment] Student email failed (non-fatal)', err);
    steps['student_email'] = 'failed';
  }

  // ── Step 6: Send internal admin notification ───────────────────────────────
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');
    const adminUrl = `${siteUrl}/admin/applications`;

    await sendEmail({
      to: 'elevate4humanityedu@gmail.com',
      subject: `New Enrollment: ${studentName} — Barber Apprenticeship`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#dc2626;padding:20px 28px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-weight:700;font-size:16px;">New Barber Apprenticeship Enrollment</p>
  </div>
  <div style="padding:28px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <p style="margin:0 0 16px;font-size:15px;">A barber apprenticeship student has paid and is ready to start.</p>

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
        <td style="padding:10px 12px;border:1px solid #e2e8f0;">Barber Apprenticeship</td>
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
        <li style="margin-bottom:6px;">Confirm host shop placement within 1–2 business days</li>
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
    logger.error('[barber-post-payment] Admin notification email failed (non-fatal)', err);
    steps['admin_email'] = 'failed';
  }

  logger.info('[barber-post-payment] Pipeline complete', { applicationId, enrollmentId, steps });

  return { success: true, enrollmentId, steps };
}
