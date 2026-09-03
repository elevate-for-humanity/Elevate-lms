import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const QMA_ENROLLMENT_OPEN_REPLY_TO = 'elevate4humanityedu@gmail.com';
export const ICC_URL = 'https://www.indianacareerconnect.com';
export const WORKONE_LOCATOR_URL = 'https://www.workone.in.gov/';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

export const QMA_APPLY_URL = '/apply?program=qma';
export const QMA_PROGRAM_URL = '/programs/qma';

export type QmaContactRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  programLabel: string;
  source: string;
  createdAt: string;
};

export function isQmaProgram(slugOrInterest: string): boolean {
  const s = slugOrInterest.toLowerCase();
  if (!s) return false;
  if (s === 'qma' || s.includes('qma')) return true;
  if (s.includes('qualified medication') || s.includes('medication aide')) return true;
  return false;
}

export function buildQmaEnrollmentOpenApplicantEmail(firstName: string): string {
  const name = firstName.trim() || 'there';
  return `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1e293b;line-height:1.7">
  <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="${PLATFORM_DEFAULTS.orgName}" style="height:56px;margin-bottom:20px"/>
  <h1 style="color:#dc2626;font-size:22px;margin:0 0 12px">QMA training is open for enrollment</h1>
  <p>Hi ${name},</p>
  <p>
    Great news — <strong>${PLATFORM_DEFAULTS.orgName}</strong> is <strong>open for enrollment</strong>
    in our <strong>Qualified Medication Aide (QMA)</strong> program. If you previously applied or
    requested information, this message is for you.
  </p>
  <p>
    <strong>Active Indiana CNA certification is required</strong> before QMA enrollment. Funding may be
    available if you qualify (WIOA, Workforce Ready Grant, and other Indiana workforce programs).
    Self-pay is also available. WorkOne determines WIOA eligibility — not Elevate alone.
  </p>

  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;margin:24px 0">
    <h2 style="color:#166534;font-size:16px;margin:0 0 12px">Your next steps</h2>
    <ol style="margin:0;padding-left:20px">
      <li style="margin-bottom:10px">
        <strong>Create an Indiana Career Connect account</strong> at
        <a href="${ICC_URL}" style="color:#dc2626">${ICC_URL}</a>
        (click <em>Create Account</em> / register as a job seeker).
      </li>
      <li style="margin-bottom:10px">
        <strong>Schedule an appointment with WorkOne</strong> through Indiana Career Connect.
        If you have trouble booking online, visit your nearest WorkOne office:
        <a href="${WORKONE_LOCATOR_URL}" style="color:#dc2626">${WORKONE_LOCATOR_URL}</a>.
      </li>
      <li style="margin-bottom:10px">
        At your appointment, tell your advisor you are enrolling with
        <strong>${PLATFORM_DEFAULTS.orgName}</strong> for <strong>QMA (Qualified Medication Aide) training</strong>.
      </li>
      <li style="margin-bottom:10px">
        <strong>After you schedule your appointment, email us the date and time</strong> at
        <a href="mailto:${QMA_ENROLLMENT_OPEN_REPLY_TO}" style="color:#dc2626">${QMA_ENROLLMENT_OPEN_REPLY_TO}</a>
        so our enrollment team can follow up and keep your file active.
      </li>
      <li>
        <strong>Complete your application on our website</strong> when you are ready:
        <a href="${SITE_URL}${QMA_APPLY_URL}" style="color:#dc2626">${SITE_URL}${QMA_APPLY_URL}</a>
      </li>
    </ol>
  </div>

  <p style="font-size:14px">
    Program page: <a href="${SITE_URL}${QMA_PROGRAM_URL}" style="color:#dc2626">${SITE_URL}${QMA_PROGRAM_URL}</a><br/>
    Main website: <a href="${SITE_URL}" style="color:#dc2626">${SITE_URL}</a>
  </p>

  <p>Questions? Call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong> or reply to this email.</p>

  <p style="margin-top:28px">
    We look forward to training with you,<br/>
    <strong>${PLATFORM_DEFAULTS.orgName} Enrollment Team</strong><br/>
    <a href="mailto:${QMA_ENROLLMENT_OPEN_REPLY_TO}">${QMA_ENROLLMENT_OPEN_REPLY_TO}</a>
  </p>
</div>`;
}

export function buildQmaEnrollmentOpenAdminRosterEmail(
  contacts: QmaContactRow[],
  emailed: QmaContactRow[],
  sendSummary: { sent: number; failed: number; skipped: number },
): string {
  const rowHtml = (r: QmaContactRow) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.firstName)} ${escapeHtml(r.lastName)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0"><a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a></td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.phone || '—')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.city || '—')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.programLabel)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.status || '—')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.source)}</td>
    </tr>`;

  const emptyNote =
    contacts.length === 0
      ? `<p style="background:#fef3c7;border:1px solid #fcd34d;padding:12px;border-radius:8px">
        <strong>No QMA applicants found</strong> in applications or leads (program slug/interest <code>qma</code>,
        Qualified Medication Aide, or Medication Aide). Blast scripts are ready when records exist.
      </p>`
      : '';

  return `
<div style="font-family:Arial,sans-serif;max-width:960px">
  <h1 style="color:#dc2626;font-size:20px">QMA (Qualified Medication Aide) — outreach report</h1>
  ${emptyNote}
  <p>
    Applicant blast: <strong>${sendSummary.sent} sent</strong>,
    ${sendSummary.failed} failed, ${sendSummary.skipped} skipped.
    Unique contacts in roster: <strong>${contacts.length}</strong>.
  </p>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px">
    <thead>
      <tr style="background:#f1f5f9;text-align:left">
        <th style="padding:10px">Name</th>
        <th style="padding:10px">Email</th>
        <th style="padding:10px">Phone</th>
        <th style="padding:10px">City</th>
        <th style="padding:10px">Program</th>
        <th style="padding:10px">Status</th>
        <th style="padding:10px">Source</th>
      </tr>
    </thead>
    <tbody>${contacts.length ? contacts.map(rowHtml).join('') : '<tr><td colspan="7" style="padding:12px">No contacts</td></tr>'}</tbody>
  </table>
  <h2 style="font-size:16px;margin-top:28px">Emailed (${emailed.length})</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">
    <thead>
      <tr style="background:#f1f5f9;text-align:left">
        <th style="padding:10px">Name</th>
        <th style="padding:10px">Email</th>
        <th style="padding:10px">Program</th>
      </tr>
    </thead>
    <tbody>${emailed.length ? emailed.map(rowHtml).join('') : '<tr><td colspan="3" style="padding:12px">None</td></tr>'}</tbody>
  </table>
</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
