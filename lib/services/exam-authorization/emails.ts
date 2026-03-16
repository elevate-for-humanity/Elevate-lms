// Email templates for the certification authorization pipeline.
//
// Three emails fire in sequence:
//   1. Staff notification  — Elevate receives student name, program, auth code
//   2. Student auth        — sent by staff (or auto-forwarded) with external link/code
//   3. Certificate issued  — student receives Elevate certificate download link
//
// Delivery mode drives template content:
//   external → exam scheduling link + authorization code
//   hybrid   → external course platform link (CareerSafe, OSHA online)
//   internal → no email (Elevate proctors on-site)

import { sendEmail } from '@/lib/email';
import type { CredentialDelivery } from './types';

const STAFF_EMAIL = 'elevate4humanityedu@gmail.com';
const FROM = 'Elevate for Humanity <noreply@elevateforhumanity.org>';
const BRAND_RED = '#DC2626';
const BRAND_DARK = '#1E293B';

// ── 1. Staff notification ─────────────────────────────────────────────────────
// Sent to Elevate staff when payment clears and auth code is generated.
// Staff forwards the student section to the student.

export async function sendStaffAuthNotification(params: {
  studentName: string;
  studentEmail: string;
  programName: string;
  credentialName: string;
  authorizationCode: string;
  expiresAt: string;
  delivery: CredentialDelivery;
  providerName: string;
  providerUrl: string | null;
  examFeePaid: number;
}) {
  const actionLine = params.delivery === 'hybrid'
    ? `<p><strong>Action:</strong> Forward the student section below to <strong>${params.studentEmail}</strong>. Include their enrollment link to <strong>${params.providerName}</strong>.</p>`
    : `<p><strong>Action:</strong> Forward the student section below to <strong>${params.studentEmail}</strong> with their exam authorization code.</p>`;

  const providerSection = params.providerUrl
    ? `<p><strong>${params.delivery === 'hybrid' ? 'Course Platform' : 'Exam Scheduling'}:</strong> <a href="${params.providerUrl}">${params.providerUrl}</a></p>`
    : `<p><strong>Provider:</strong> ${params.providerName} — schedule manually</p>`;

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:${BRAND_DARK};line-height:1.6;margin:0;padding:0">
<div style="max-width:600px;margin:0 auto;padding:20px">

  <div style="background:${BRAND_DARK};color:white;padding:24px 30px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px">Exam Authorization Ready</h1>
    <p style="margin:4px 0 0;opacity:0.8;font-size:14px">Action required — forward to student</p>
  </div>

  <div style="background:#f8fafc;padding:24px 30px;border:1px solid #e2e8f0;border-top:none">
    <h2 style="margin-top:0;font-size:16px">Student Details</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#64748b;width:40%">Student</td><td><strong>${params.studentName}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Email</td><td>${params.studentEmail}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Program</td><td>${params.programName}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Credential</td><td>${params.credentialName}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Exam Fee Paid</td><td>$${(params.examFeePaid / 100).toFixed(2)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Auth Expires</td><td>${new Date(params.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
    </table>

    ${actionLine}
    ${providerSection}

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">

    <h2 style="font-size:16px;color:${BRAND_RED}">── Forward to Student ──────────────────</h2>
    <div style="background:white;border:2px dashed #e2e8f0;border-radius:8px;padding:20px">
      <p>Hi ${params.studentName},</p>
      <p>You have completed your <strong>${params.programName}</strong> training at Elevate for Humanity. You are now authorized to ${params.delivery === 'hybrid' ? 'complete your' : 'sit for your'} <strong>${params.credentialName}</strong> ${params.delivery === 'hybrid' ? 'course and exam' : 'exam'}.</p>
      ${params.delivery === 'hybrid'
        ? `<p><strong>Next step:</strong> Complete your course at <a href="${params.providerUrl ?? '#'}">${params.providerName}</a>. Your enrollment has been paid by Elevate.</p>`
        : `<p><strong>Authorization Code:</strong></p>
           <div style="background:#f1f5f9;border-radius:6px;padding:16px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:4px;font-family:monospace">${params.authorizationCode}</div>
           ${params.providerUrl ? `<p style="text-align:center;margin-top:16px"><a href="${params.providerUrl}" style="display:inline-block;padding:12px 28px;background:${BRAND_RED};color:white;text-decoration:none;border-radius:6px;font-weight:bold">Schedule Your Exam →</a></p>` : ''}`
      }
      <p>Once you have your certificate, log back in to your Elevate student portal and upload it under <strong>My Certifications</strong>.</p>
      <p>Questions? Reply to this email or call (317) 314-3757.</p>
      <p>— Elevate for Humanity Team</p>
    </div>
  </div>

</div>
</body></html>`;

  return sendEmail({
    to: STAFF_EMAIL,
    subject: `[Action Required] Exam Auth — ${params.studentName} — ${params.credentialName}`,
    html,
    from: FROM,
    replyTo: STAFF_EMAIL,
  });
}

// ── 2. Student: certificate issued ────────────────────────────────────────────
// Sent after admin verifies the uploaded credential and issues the Elevate cert.

export async function sendCertificateIssuedEmail(params: {
  studentName: string;
  studentEmail: string;
  programName: string;
  credentialName: string;
  certificateNumber: string;
  downloadUrl: string;
  issuedAt: string;
}) {
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:${BRAND_DARK};line-height:1.6;margin:0;padding:0">
<div style="max-width:600px;margin:0 auto;padding:20px">

  <div style="background:${BRAND_RED};color:white;padding:24px 30px;border-radius:8px 8px 0 0;text-align:center">
    <h1 style="margin:0;font-size:22px">Congratulations, ${params.studentName}!</h1>
    <p style="margin:6px 0 0;opacity:0.9">Your Elevate certificate is ready</p>
  </div>

  <div style="background:#f8fafc;padding:24px 30px;border:1px solid #e2e8f0;border-top:none">
    <p>You have successfully completed <strong>${params.programName}</strong> and earned your <strong>${params.credentialName}</strong> certification.</p>
    <p>Elevate for Humanity has issued your official certificate of completion.</p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:40%">Certificate Number</td><td><strong>${params.certificateNumber}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Program</td><td>${params.programName}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Credential</td><td>${params.credentialName}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Issued</td><td>${new Date(params.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
    </table>

    <p style="text-align:center;margin:24px 0">
      <a href="${params.downloadUrl}" style="display:inline-block;padding:14px 32px;background:${BRAND_RED};color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px">Download Your Certificate →</a>
    </p>

    <p style="font-size:13px;color:#64748b">You can also access your certificate anytime from your student portal under <strong>My Certifications</strong>.</p>
    <p>We are proud of your achievement. Best of luck in your career.</p>
    <p>— Elevate for Humanity Team<br>
    <span style="font-size:13px;color:#64748b">8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240 · (317) 314-3757</span></p>
  </div>

</div>
</body></html>`;

  return sendEmail({
    to: params.studentEmail,
    bcc: STAFF_EMAIL,
    subject: `Your Elevate Certificate — ${params.credentialName}`,
    html,
    from: FROM,
    replyTo: STAFF_EMAIL,
  });
}
