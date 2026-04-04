/**
 * Post-approval actions by program slug.
 *
 * Called after approveApplication() succeeds. Sends approval email with
 * Elevate LMS access instructions. All actions are non-fatal.
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  const { programSlug, studentEmail, studentName, passwordSetupLink } = input;

  const siteUrl       = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const firstName     = studentName?.split(' ')[0] || 'there';
  const onboardingUrl = `${siteUrl}/onboarding/learner`;
  const dashboardUrl  = `${siteUrl}/learner/dashboard`;
  const lmsUrl        = `${siteUrl}/lms/courses`;

  if (programSlug === 'barber-apprenticeship') {
    await sendBarberApprovalEmail({ studentEmail, firstName, passwordSetupLink: passwordSetupLink ?? null, onboardingUrl, dashboardUrl, lmsUrl, siteUrl });
  } else {
    await sendGenericApprovalEmail({ studentEmail, firstName, passwordSetupLink: passwordSetupLink ?? null, onboardingUrl, dashboardUrl, siteUrl });
  }
}

async function sendBarberApprovalEmail({
  studentEmail, firstName, passwordSetupLink, onboardingUrl, dashboardUrl, lmsUrl, siteUrl,
}: {
  studentEmail: string; firstName: string; passwordSetupLink: string | null;
  onboardingUrl: string; dashboardUrl: string; lmsUrl: string; siteUrl: string;
}) {
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');

    const step1 = passwordSetupLink
      ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
           <h3 style="margin-top:0;color:#166534;">Step 1 — Set Your Password</h3>
           <p style="margin-bottom:16px;">Your student account is ready. Set your password to access your dashboard and coursework:</p>
           <p style="text-align:center;margin:16px 0;">
             <a href="${passwordSetupLink}" style="display:inline-block;background:#16a34a;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Set Password &amp; Log In →</a>
           </p>
           <p style="color:#64748b;font-size:12px;margin:0;">Link expires in 24 hours. Log in at <a href="${siteUrl}/login">${siteUrl}/login</a></p>
         </div>`
      : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
           <h3 style="margin-top:0;color:#166534;">Step 1 — Log In to Your Dashboard</h3>
           <p style="text-align:center;margin:16px 0;">
             <a href="${dashboardUrl}" style="display:inline-block;background:#16a34a;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Go to Student Dashboard →</a>
           </p>
         </div>`;

    await sendEmail({
      to: studentEmail,
      subject: "You're Approved — Barber Apprenticeship | Elevate for Humanity",
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Barber Apprenticeship Program</p>
  </div>
  <div style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">Congratulations, ${firstName}! You're approved.</h1>
    <p style="color:#475569;margin:0 0 24px;">Your Barber Apprenticeship enrollment is confirmed.</p>

    ${step1}

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin-top:0;color:#92400e;">Step 2 — Complete Onboarding (10 minutes)</h3>
      <p style="margin-bottom:16px;">Unlocks your coursework and training schedule.</p>
      <p style="text-align:center;margin:16px 0;">
        <a href="${onboardingUrl}" style="display:inline-block;background:#d97706;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Start Onboarding →</a>
      </p>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin-top:0;color:#1e40af;">Step 3 — Start Your Coursework</h3>
      <p style="margin-bottom:12px;">Your related instruction is in the <strong>Elevate LMS</strong> — lessons, quizzes, and checkpoints are all in your student portal.</p>
      <p style="text-align:center;margin:16px 0;">
        <a href="${lmsUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Go to My Courses →</a>
      </p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
      <h3 style="margin-top:0;color:#0f172a;font-size:15px;">Next Steps</h3>
      <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;">
        <li style="margin-bottom:8px;">Log in to your student dashboard</li>
        <li style="margin-bottom:8px;">Complete the 10-minute onboarding module</li>
        <li style="margin-bottom:8px;">Begin your coursework in the Elevate LMS</li>
        <li style="margin-bottom:0;">Your advisor will contact you within 1–2 business days to confirm your host shop and start date</li>
      </ol>
    </div>

    <p style="color:#475569;font-size:14px;">Questions? Call <a href="tel:3173143757" style="color:#ea580c;font-weight:bold;">317-314-3757</a> or email <a href="mailto:info@elevateforhumanity.org" style="color:#ea580c;">info@elevateforhumanity.org</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Elevate for Humanity Career &amp; Technical Institute<br />8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
  </div>
</div>`,
    });
    logger.info('[post-approval] Barber approval email sent', { to: studentEmail });
  } catch (err) {
    logger.error('[post-approval] Barber approval email failed (non-fatal)', err);
  }
}

async function sendGenericApprovalEmail({
  studentEmail, firstName, passwordSetupLink, onboardingUrl, dashboardUrl, siteUrl,
}: {
  studentEmail: string; firstName: string; passwordSetupLink: string | null;
  onboardingUrl: string; dashboardUrl: string; siteUrl: string;
}) {
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');
    const ctaUrl   = passwordSetupLink ?? dashboardUrl;
    const ctaLabel = passwordSetupLink ? 'Set Password &amp; Log In →' : 'Go to Dashboard →';

    await sendEmail({
      to: studentEmail,
      subject: "You're Approved — Elevate for Humanity",
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
  </div>
  <div style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="margin:0 0 8px;font-size:24px;">Congratulations, ${firstName}! You're approved.</h1>
    <p style="color:#475569;margin:0 0 24px;">Your enrollment is confirmed.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${ctaUrl}" style="display:inline-block;background:#16a34a;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">${ctaLabel}</a>
    </p>
    <p style="text-align:center;">
      <a href="${onboardingUrl}" style="display:inline-block;background:#d97706;color:white;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Complete Onboarding →</a>
    </p>
    <p style="color:#475569;font-size:14px;margin-top:24px;">Questions? Call <a href="tel:3173143757" style="color:#ea580c;font-weight:bold;">317-314-3757</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Elevate for Humanity · 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
  </div>
</div>`,
    });
    logger.info('[post-approval] Generic approval email sent', { to: studentEmail });
  } catch (err) {
    logger.error('[post-approval] Generic approval email failed (non-fatal)', err);
  }
}
