import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Email templates for funded application follow-up sequences.
 *
 * pending_funding  — student selected WIOA/WRG/FSSA but has NOT been to
 *                    Indiana Career Connect yet. Nudge them to book an
 *                    appointment and return to complete their application.
 *
 * pending_admin_review — student has been to ICC (or is in process) and
 *                        their application is waiting on admin verification.
 *                        Reassure them and prompt them to call if stuck.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;
const PHONE = PLATFORM_DEFAULTS.supportPhone;
const ICC_URL = 'https://www.in.gov/dwd/indiana-career-connect/';

// ── Shared chrome ────────────────────────────────────────────────────────────

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
    <div style="background:#dc2626;padding:28px 32px">
      <img src="${SITE}/logo.jpg" alt={PLATFORM_DEFAULTS.orgName} height="40" style="display:block">
    </div>
    <div style="padding:32px">
      ${body}
    </div>
    <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;text-align:center">
      <p style="margin:0 0 4px">${PLATFORM_DEFAULTS.orgName} Career &amp; Technical Institute</p>
      <p style="margin:0 0 4px">8888 Keystone Crossing Suite 1300 · Indianapolis, IN 46240</p>
      <p style="margin:0"><a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}" style="color:#dc2626">${PHONE}</a> · <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}" style="color:#dc2626">info@${PLATFORM_DEFAULTS.canonicalDomain}</a></p>
    </div>
  </div>
</body>
</html>`;
}

function btn(label: string, url: string): string {
  return `<p style="text-align:center;margin:28px 0">
    <a href="${url}" style="display:inline-block;padding:14px 36px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px">${label}</a>
  </p>`;
}

// ── pending_funding — 48 h nudge ─────────────────────────────────────────────

export function pendingFundingFollowupHtml(params: {
  firstName: string;
  programName: string;
  applicationId: string;
  followupCount: number; // 1 = first nudge, 2 = second nudge
}): { subject: string; html: string } {
  const { firstName, programName, followupCount } = params;

  const isSecond = followupCount >= 2;
  const subject = isSecond
    ? `Last step to start ${programName} — your funding appointment`
    : `Next step for your ${programName} application`;

  const urgency = isSecond
    ? `<p style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px;margin:20px 0">
        <strong>Your application is still waiting.</strong> Spots in this program fill quickly — completing your WorkOne appointment keeps your place in line.
       </p>`
    : '';

  const html = wrap(`
    <h2 style="margin-top:0;color:#111">Hi ${firstName},</h2>
    <p>You applied for <strong>${programName}</strong> and selected WIOA / Workforce Ready Grant funding — great choice. Most eligible students pay <strong>$0 in tuition</strong>.</p>
    ${urgency}
    <p>To unlock your funding, you need to complete one step: <strong>visit your local WorkOne / Indiana Career Connect office</strong>. They confirm your eligibility and authorize the funding directly to us.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px;font-weight:bold;color:#166534">What to do next:</p>
      <ol style="margin:0;padding-left:20px;color:#166534">
        <li style="margin-bottom:6px">Book an appointment at Indiana Career Connect</li>
        <li style="margin-bottom:6px">Tell them you want to enroll in <strong>${programName}</strong> at ${PLATFORM_DEFAULTS.orgName}</li>
        <li style="margin-bottom:6px">They will issue a referral or training authorization</li>
        <li>Return to us — we handle the rest</li>
      </ol>
    </div>

    ${btn('Book a WorkOne Appointment', ICC_URL)}

    <p>Or call us and we can walk you through it together:</p>
    <p style="font-size:18px;font-weight:bold;text-align:center"><a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}" style="color:#dc2626">${PHONE}</a></p>

    <p style="color:#6b7280;font-size:14px">If you've already been to WorkOne, reply to this email or call us — we may already have your referral and just need to match it to your application.</p>
  `);

  return { subject, html };
}

// ── pending_admin_review — 72 h reassurance ──────────────────────────────────

export function pendingAdminReviewFollowupHtml(params: {
  firstName: string;
  programName: string;
  followupCount: number;
}): { subject: string; html: string } {
  const { firstName, programName, followupCount } = params;

  const isSecond = followupCount >= 2;
  const subject = isSecond
    ? `Update on your ${programName} application`
    : `Your ${programName} application — we're reviewing it now`;

  const body = isSecond
    ? `<p>We wanted to give you a quick update: your <strong>${programName}</strong> application is still under review. We're verifying your funding authorization with WorkOne / Indiana Career Connect.</p>
       <p>This process typically takes 3–5 business days from the time your WorkOne counselor submits the referral. If it's been longer than that, please call us — we can check the status directly.</p>`
    : `<p>Good news — we received your <strong>${programName}</strong> application and it's now in our review queue.</p>
       <p>We're verifying your funding authorization with WorkOne / Indiana Career Connect. Once confirmed, we'll activate your enrollment and send you login details for the student portal.</p>`;

  const html = wrap(`
    <h2 style="margin-top:0;color:#111">Hi ${firstName},</h2>
    ${body}

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px;font-weight:bold;color:#1e40af">While you wait:</p>
      <ul style="margin:0;padding-left:20px;color:#1e40af">
        <li style="margin-bottom:6px">Make sure your WorkOne counselor has submitted your training referral</li>
        <li style="margin-bottom:6px">Check your spam folder for emails from <strong>info@${PLATFORM_DEFAULTS.canonicalDomain}</strong></li>
        <li>Have questions? Call or text us anytime</li>
      </ul>
    </div>

    ${btn('Check Application Status', `${SITE}/apply/status`)}

    <p style="text-align:center;color:#6b7280">Or call / text us directly: <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}" style="color:#dc2626;font-weight:bold">${PHONE}</a></p>
  `);

  return { subject, html };
}
