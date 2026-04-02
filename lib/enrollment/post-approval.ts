/**
 * Post-approval actions by program slug.
 *
 * Called after approveApplication() succeeds. Handles program-specific
 * steps: Milady provisioning for barber, future integrations for other programs.
 *
 * All actions are non-fatal — a failure here never rolls back the approval.
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const MILADY_LOGIN_URL = 'https://www.miladytraining.com/users/sign_in';

export interface PostApprovalInput {
  db: SupabaseClient;
  applicationId: string;
  programSlug: string | null | undefined;
  studentEmail: string;
  studentName: string | null | undefined;
  studentPhone?: string | null;
  passwordSetupLink?: string | null;
  enrollmentId?: string | null;
}

export async function runPostApprovalActions(input: PostApprovalInput): Promise<void> {
  const { programSlug, studentEmail, studentName, passwordSetupLink, enrollmentId } = input;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const firstName = studentName?.split(' ')[0] || 'there';

  const onboardingUrl = `${siteUrl}/onboarding/learner`;
  const dashboardUrl  = `${siteUrl}/learner/dashboard`;

  // ── Barber Apprenticeship ─────────────────────────────────────────────────
  if (programSlug === 'barber-apprenticeship') {
    await sendBarberApprovalEmail({
      studentEmail,
      firstName,
      passwordSetupLink: passwordSetupLink ?? null,
      onboardingUrl,
      dashboardUrl,
      siteUrl,
    });

    await sendMiladyAdminNotification({
      studentEmail,
      studentName: studentName ?? studentEmail,
      studentPhone: input.studentPhone ?? null,
      siteUrl,
    });

    await queueMiladyProvisioning(input.db, {
      studentEmail,
      studentName: studentName ?? null,
    });
  } else {
    // Generic post-approval email for all other programs
    await sendGenericApprovalEmail({
      studentEmail,
      firstName,
      passwordSetupLink: passwordSetupLink ?? null,
      onboardingUrl,
      dashboardUrl,
      siteUrl,
    });
  }
}

// ── Barber-specific approval email ───────────────────────────────────────────

async function sendBarberApprovalEmail({
  studentEmail,
  firstName,
  passwordSetupLink,
  onboardingUrl,
  dashboardUrl,
  siteUrl,
}: {
  studentEmail: string;
  firstName: string;
  passwordSetupLink: string | null;
  onboardingUrl: string;
  dashboardUrl: string;
  siteUrl: string;
}) {
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');

    const passwordBlock = passwordSetupLink ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="margin-top:0;color:#166534;">Step 1 — Set Your Password</h3>
        <p style="margin-bottom:16px;">Your student account is ready. Set your password to access your dashboard and coursework:</p>
        <p style="text-align:center;margin:16px 0;">
          <a href="${passwordSetupLink}"
             style="display:inline-block;background:#16a34a;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
            Set Password &amp; Log In →
          </a>
        </p>
        <p style="color:#64748b;font-size:12px;margin:0;">Link expires in 24 hours. After setting your password, log in at <a href="${siteUrl}/login">${siteUrl}/login</a></p>
      </div>
    ` : `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="margin-top:0;color:#166534;">Step 1 — Log In to Your Dashboard</h3>
        <p style="text-align:center;margin:16px 0;">
          <a href="${dashboardUrl}"
             style="display:inline-block;background:#16a34a;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
            Go to Student Dashboard →
          </a>
        </p>
      </div>
    `;

    await sendEmail({
      to: studentEmail,
      subject: 'You\'re Approved — Barber Apprenticeship | Elevate for Humanity',
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Barber Apprenticeship Program</p>
  </div>

  <div style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">Congratulations, ${firstName}! You're approved.</h1>
    <p style="color:#475569;margin:0 0 24px;">Your Barber Apprenticeship enrollment is confirmed. Here's everything you need to get started.</p>

    ${passwordBlock}

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin-top:0;color:#92400e;">Step 2 — Complete Onboarding (10 minutes)</h3>
      <p style="margin-bottom:16px;">Complete your onboarding to unlock your coursework and get your training schedule.</p>
      <p style="text-align:center;margin:16px 0;">
        <a href="${onboardingUrl}"
           style="display:inline-block;background:#d97706;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
          Start Onboarding →
        </a>
      </p>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin-top:0;color:#1e40af;">Step 3 — Set Up Your Milady Account</h3>
      <p style="margin-bottom:12px;">Your related instruction is delivered through <strong>Milady</strong>, the industry-standard cosmetology and barbering curriculum platform.</p>
      <p style="margin-bottom:12px;"><strong>What to expect:</strong></p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#374151;">
        <li style="margin-bottom:6px;">Milady will send you a separate email with your login credentials within 24 hours</li>
        <li style="margin-bottom:6px;">Check your spam/junk folder if you don't see it</li>
        <li style="margin-bottom:6px;">Once active, log in at <a href="${MILADY_LOGIN_URL}" style="color:#2563eb;">${MILADY_LOGIN_URL}</a></li>
        <li style="margin-bottom:0;">Your Milady coursework runs alongside your on-the-job training hours</li>
      </ul>
      <p style="text-align:center;margin:16px 0;">
        <a href="${MILADY_LOGIN_URL}"
           style="display:inline-block;background:#2563eb;color:white;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
          Go to Milady Login →
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;margin:0;">Didn't receive Milady credentials within 24 hours? Call us at <a href="tel:3173143757" style="color:#2563eb;">317-314-3757</a></p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
      <h3 style="margin-top:0;color:#0f172a;font-size:15px;">Your Next Steps at a Glance</h3>
      <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;">
        <li style="margin-bottom:8px;">Set your password and log in to your student dashboard</li>
        <li style="margin-bottom:8px;">Complete the 10-minute onboarding module</li>
        <li style="margin-bottom:8px;">Watch for your Milady credentials email (within 24 hours)</li>
        <li style="margin-bottom:0;">Your advisor will contact you within 1–2 business days to confirm your host shop and start date</li>
      </ol>
    </div>

    <p style="color:#475569;font-size:14px;">Questions? Call <a href="tel:3173143757" style="color:#ea580c;font-weight:bold;">317-314-3757</a> or email <a href="mailto:info@elevateforhumanity.org" style="color:#ea580c;">info@elevateforhumanity.org</a></p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
      Elevate for Humanity Career &amp; Technical Institute<br />
      8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240
    </p>
  </div>
</div>
      `,
    });

    logger.info('[post-approval] Barber approval email sent', { to: studentEmail });
  } catch (err) {
    logger.error('[post-approval] Barber approval email failed (non-fatal)', err);
  }
}

// ── Milady admin notification ─────────────────────────────────────────────────

async function sendMiladyAdminNotification({
  studentEmail,
  studentName,
  studentPhone,
  siteUrl,
}: {
  studentEmail: string;
  studentName: string;
  studentPhone: string | null;
  siteUrl: string;
}) {
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');
    await sendEmail({
      to: 'elevate4humanityedu@gmail.com',
      subject: `ACTION REQUIRED — Milady Provisioning: ${studentName}`,
      html: `
<h2>New Barber Apprentice — Milady Account Needed</h2>
<p>A barber apprenticeship student has been approved and needs a Milady account created.</p>
<table style="border-collapse:collapse;width:100%;max-width:500px;">
  <tr><td style="padding:8px;font-weight:bold;border:1px solid #e2e8f0;">Name</td><td style="padding:8px;border:1px solid #e2e8f0;">${studentName}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;border:1px solid #e2e8f0;">Email</td><td style="padding:8px;border:1px solid #e2e8f0;">${studentEmail}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;border:1px solid #e2e8f0;">Phone</td><td style="padding:8px;border:1px solid #e2e8f0;">${studentPhone || 'Not provided'}</td></tr>
</table>
<p><strong>Action:</strong> Create a Milady account for this student and send them their login credentials.</p>
<p><a href="${siteUrl}/admin/applications" style="background:#ea580c;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">View in Admin Portal</a></p>
      `,
    });
    logger.info('[post-approval] Milady admin notification sent', { studentEmail });
  } catch (err) {
    logger.error('[post-approval] Milady admin notification failed (non-fatal)', err);
  }
}

// ── Milady provisioning queue ─────────────────────────────────────────────────

async function queueMiladyProvisioning(
  db: SupabaseClient,
  { studentEmail, studentName }: { studentEmail: string; studentName: string | null },
) {
  try {
    await db
      .from('milady_provisioning_queue')
      .insert({
        student_email: studentEmail,
        student_name: studentName,
        program_slug: 'barber-apprenticeship',
        status: 'pending',
      });
    logger.info('[post-approval] Milady provisioning queued', { studentEmail });
  } catch (err) {
    logger.error('[post-approval] milady_provisioning_queue insert failed (non-fatal)', err);
  }
}

// ── Generic approval email (non-barber programs) ──────────────────────────────

async function sendGenericApprovalEmail({
  studentEmail,
  firstName,
  passwordSetupLink,
  onboardingUrl,
  dashboardUrl,
  siteUrl,
}: {
  studentEmail: string;
  firstName: string;
  passwordSetupLink: string | null;
  onboardingUrl: string;
  dashboardUrl: string;
  siteUrl: string;
}) {
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');

    const ctaUrl    = passwordSetupLink ?? dashboardUrl;
    const ctaLabel  = passwordSetupLink ? 'Set Password &amp; Log In →' : 'Go to Dashboard →';

    await sendEmail({
      to: studentEmail,
      subject: 'You\'re Approved — Elevate for Humanity',
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
  </div>
  <div style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="margin:0 0 8px;font-size:24px;">Congratulations, ${firstName}! You're approved.</h1>
    <p style="color:#475569;margin:0 0 24px;">Your enrollment is confirmed. Here's how to get started.</p>

    <p style="text-align:center;margin:24px 0;">
      <a href="${ctaUrl}"
         style="display:inline-block;background:#16a34a;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
        ${ctaLabel}
      </a>
    </p>

    <p style="text-align:center;">
      <a href="${onboardingUrl}"
         style="display:inline-block;background:#d97706;color:white;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
        Complete Onboarding →
      </a>
    </p>

    <p style="color:#475569;font-size:14px;margin-top:24px;">Questions? Call <a href="tel:3173143757" style="color:#ea580c;font-weight:bold;">317-314-3757</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
      Elevate for Humanity · 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240
    </p>
  </div>
</div>
      `,
    });
    logger.info('[post-approval] Generic approval email sent', { to: studentEmail });
  } catch (err) {
    logger.error('[post-approval] Generic approval email failed (non-fatal)', err);
  }
}
