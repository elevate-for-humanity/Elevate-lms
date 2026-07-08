/**
 * Post-approval actions by program slug.
 *
 * Called after approveApplication() succeeds. Sends approval email with
 * Elevate LMS access instructions. All actions are non-fatal.
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import { sendTeamsMessage } from '@/lib/notifications/teams';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface PostApprovalInput {
  db: SupabaseClient;
  applicationId: string;
  programSlug: string | null | undefined;
  studentEmail: string;
  studentName: string | null | undefined;
  studentPhone?: string | null;
  studentCity?: string | null;
  fundingType?: string | null;
  tempPassword?: string | null;
  /** One-time recovery link for new accounts — preferred over tempPassword */
  passwordSetupLink?: string | null;
  enrollmentId?: string | null;
}

// Slug → human-readable program title. Covers all programs in the intake form.
const PROGRAM_TITLES: Record<string, string> = {
  'cna': 'Certified Nursing Assistant (CNA)',
  'medical-assistant': 'Medical Assistant',
  'phlebotomy': 'Phlebotomy Technician',
  'pharmacy-technician': 'Pharmacy Technician',
  'home-health-aide': 'Home Health Aide',
  'peer-recovery-specialist': 'Peer Recovery Specialist',
  'cpr-first-aid': 'CPR, AED & First Aid',
  'hvac-technician': 'HVAC Technician',
  'cdl-training': 'CDL — Commercial Driver License',
  'welding': 'Welding Technology',
  'electrical': 'Electrical Technician',
  'plumbing': 'Plumbing Technician',
  'forklift': 'Forklift Operator Certification',
  'barber-apprenticeship': 'Barber Apprenticeship',
  'cosmetology-apprenticeship': 'Cosmetology Apprenticeship',
  'esthetician': 'Professional Esthetician & Client Services',
  'it-help-desk': 'IT Help Desk Technician',
  'cybersecurity-analyst': 'Cybersecurity Analyst',
  'network-administration': 'Network Administration',
  'software-development': 'Software Development Foundations',
  'web-development': 'Web Development',
  'project-management': 'Project Management',
  'office-administration': 'Office Administration',
  'bookkeeping': 'Bookkeeping & QuickBooks',
  'tax-preparation': 'Tax Preparation',
  'entrepreneurship': 'Entrepreneurship & Small Business',
};

const FUNDING_LABELS: Record<string, string> = {
  'wioa': 'WIOA (Workforce Innovation and Opportunity Act)',
  'wioa-categorical': 'WIOA — Categorical Eligibility',
  'wioa-income': 'WIOA — Income Eligible',
  'jri': 'Job Ready Indy (JRI)',
  'self-pay': 'Self-Pay',
  'wrg': 'Workforce Ready Grant',
  'fssa': 'FSSA IMPACT',
  'employer': 'Employer Sponsored',
  'pending-review': 'Pending Funding Review',
};

export async function runPostApprovalActions(input: PostApprovalInput): Promise<void> {
  const {
    programSlug,
    studentEmail,
    studentName,
    studentPhone,
    studentCity,
    fundingType,
    tempPassword,
    passwordSetupLink,
    enrollmentId,
  } = input;



  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  const firstName = studentName?.split(' ')[0] || studentEmail.split('@')[0];
  const programTitle = (programSlug && PROGRAM_TITLES[programSlug]) || programSlug || 'your program';
  const fundingLabel = (fundingType && FUNDING_LABELS[fundingType]) || null;
  const onboardingUrl = `${siteUrl}/onboarding/learner`;
  const loginUrl = `${siteUrl}/login?redirect=/onboarding/learner`;
  // Prefer one-time recovery link for new accounts; fall back to login page.
  const accountSetupUrl = passwordSetupLink || loginUrl;

  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');

    await sendEmail({
      to: studentEmail,
      subject: `You're Enrolled — ${programTitle} | ${PLATFORM_DEFAULTS.orgName}`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">

  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">${PLATFORM_DEFAULTS.orgName}</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Career &amp; Technical Institute · Indianapolis, Indiana</p>
  </div>

  <div style="padding:32px;background:#fff;border:1px solid #e2e8f0;border-top:none;">

    <h1 style="margin:0 0 6px;font-size:24px;color:#0f172a;">Congratulations, ${firstName}.</h1>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;">Your enrollment in the <strong style="color:#0f172a;">${programTitle}</strong> program has been approved by our admissions team.</p>

    ${fundingLabel ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 18px;margin:0 0 24px;">
      <p style="margin:0;font-size:13px;color:#166534;"><strong>Funding:</strong> ${fundingLabel}</p>
    </div>` : ''}

    <!-- Account / Login -->
    <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:10px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.05em;">Step 1 — Log In Now</p>
      <h2 style="margin:0 0 12px;font-size:18px;color:#14532d;">Your Student Account Is Ready</h2>
      ${tempPassword ? `
      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:14px 20px;margin:0 0 16px;display:inline-block;text-align:left;">
        <p style="margin:0 0 4px;font-size:12px;color:#9a3412;font-weight:700;">SECURE ACCOUNT SETUP REQUIRED</p>
        <p style="margin:0;font-size:13px;color:#7c2d12;">For security, we do not send passwords by email. Use the onboarding link below to securely set your password.</p>
      </div>
      ` : ''}
      <br/>
      <a href="${accountSetupUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">${passwordSetupLink ? 'Set Password &amp; Start Onboarding →' : 'Log In &amp; Start Onboarding →'}</a>
      <p style="margin:10px 0 0;font-size:12px;color:#6b7280;">Log in at <a href="${siteUrl}/login" style="color:#2563eb;">${siteUrl}/login</a> with your email after completing password setup.</p>
    </div>

    <!-- Onboarding steps -->
    <h3 style="margin:0 0 14px;font-size:15px;color:#0f172a;">Your enrollment checklist</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 14px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;vertical-align:top;">
          <p style="margin:0 0 3px;font-weight:700;font-size:13px;color:#0f172a;">1 &nbsp;Set your password and log in</p>
          <p style="margin:0;font-size:12px;color:#64748b;">Use your email and complete secure password setup via the onboarding link above. No temporary password is sent by email.</p>
        </td>
      </tr>
      <tr><td style="height:6px;"></td></tr>
      <tr>
        <td style="padding:12px 14px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;vertical-align:top;">
          <p style="margin:0 0 3px;font-weight:700;font-size:13px;color:#0f172a;">2 &nbsp;Upload your government-issued ID</p>
          <p style="margin:0;font-size:12px;color:#64748b;">Required before your coursework unlocks. Driver's license, state ID, or passport accepted.</p>
        </td>
      </tr>
      <tr><td style="height:6px;"></td></tr>
      <tr>
        <td style="padding:12px 14px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;vertical-align:top;">
          <p style="margin:0 0 3px;font-weight:700;font-size:13px;color:#0f172a;">3 &nbsp;Sign your enrollment agreement</p>
          <p style="margin:0;font-size:12px;color:#64748b;">Review and sign your ${programTitle} enrollment agreement and student handbook acknowledgment.</p>
        </td>
      </tr>
      <tr><td style="height:6px;"></td></tr>
      <tr>
        <td style="padding:12px 14px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;vertical-align:top;">
          <p style="margin:0 0 3px;font-weight:700;font-size:13px;color:#0f172a;">4 &nbsp;Complete orientation</p>
          <p style="margin:0;font-size:12px;color:#64748b;">A short module covering your program schedule, expectations, and what to bring on day one. Takes about 10 minutes.</p>
        </td>
      </tr>
      <tr><td style="height:6px;"></td></tr>
      <tr>
        <td style="padding:12px 14px;border:1px solid #eff6ff;border-radius:6px;background:#eff6ff;vertical-align:top;">
          <p style="margin:0 0 3px;font-weight:700;font-size:13px;color:#1e40af;">5 &nbsp;Your courses unlock automatically</p>
          <p style="margin:0;font-size:12px;color:#3730a3;">Once onboarding is complete your ${programTitle} coursework is available in your student dashboard. Your advisor will confirm your cohort start date within 1–2 business days.</p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin:28px 0 0;">
      <a href="${onboardingUrl}" style="display:inline-block;background:#1e293b;color:#fff;padding:13px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Go to My Onboarding →</a>
    </div>

    <!-- Contact -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:28px 0 0;">
      <p style="margin:0 0 4px;font-weight:700;font-size:13px;color:#0f172a;">Questions? Contact your admissions advisor:</p>
      <p style="margin:0;font-size:13px;color:#475569;">
        <a href="tel:${PLATFORM_DEFAULTS.supportPhone}" style="color:#ea580c;font-weight:700;text-decoration:none;">${PLATFORM_DEFAULTS.supportPhone}</a>
        &nbsp;·&nbsp;
        <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}" style="color:#ea580c;text-decoration:none;">info@${PLATFORM_DEFAULTS.canonicalDomain}</a>
        &nbsp;·&nbsp;
        <a href="${siteUrl}/booking" style="color:#2563eb;text-decoration:none;">Schedule a meeting</a>
      </p>
    </div>

  </div>

  <div style="padding:16px 32px;text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <p style="margin:0;color:#94a3b8;font-size:11px;">${PLATFORM_DEFAULTS.orgName} Career &amp; Technical Institute · 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
  </div>

</div>`,
    });

    logger.info('[post-approval] Enrollment email sent', { to: studentEmail, program: programTitle });
  } catch (err) {
    logger.error('[post-approval] Enrollment email failed (non-fatal)', err);
  }

  // Teams notification — non-fatal
  await sendTeamsMessage(
    'Application Approved',
    `${studentName || studentEmail} enrolled in **${programTitle}**${fundingLabel ? ` · ${fundingLabel}` : ''}.`,
    {
      Student: studentEmail,
      Phone: studentPhone ?? 'N/A',
      City: studentCity ?? 'N/A',
      Program: programTitle,
      Funding: fundingLabel ?? 'N/A',
      'Enrollment ID': enrollmentId ?? 'N/A',
    },
  ).catch((err) => logger.error('[post-approval] Teams notification failed', err));
}

