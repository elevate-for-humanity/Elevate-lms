import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const BEAUTY_ENROLLMENT_OPEN_REPLY_TO = 'elevate4humanityedu@gmail.com';
export const ICC_URL = 'https://www.indianacareerconnect.com';
export const WORKONE_LOCATOR_URL = 'https://www.workone.in.gov/';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

export type BeautyTrack = 'esthetician' | 'cosmetology' | 'nail';

export type BeautyContactRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  programLabel: string;
  track: BeautyTrack;
  source: string;
  createdAt: string;
};

const TRACK_CONFIG: Record<
  BeautyTrack,
  { programTitle: string; applyPath: string; programPath: string }
> = {
  esthetician: {
    programTitle: 'Esthetician program (apprenticeship or client services certificate)',
    applyPath: '/apply?program=esthetician-apprenticeship',
    programPath: '/programs/esthetician-apprenticeship',
  },
  cosmetology: {
    programTitle: 'Cosmetology Apprenticeship',
    applyPath: '/apply?program=cosmetology-apprenticeship',
    programPath: '/programs/cosmetology-apprenticeship',
  },
  nail: {
    programTitle: 'Nail Technician Apprenticeship',
    applyPath: '/apply?program=nail-technician-apprenticeship',
    programPath: '/programs/nail-technician-apprenticeship',
  },
};

export function resolveBeautyTrack(slugOrInterest: string): BeautyTrack | null {
  const s = slugOrInterest.toLowerCase();
  if (s.includes('nail')) return 'nail';
  if (s.includes('cosmetolog')) return 'cosmetology';
  if (s.includes('esthetic') || s.includes('aesthetic')) return 'esthetician';
  return null;
}

export function buildBeautyEnrollmentOpenApplicantEmail(
  firstName: string,
  track: BeautyTrack,
): string {
  const name = firstName.trim() || 'there';
  const cfg = TRACK_CONFIG[track];
  return `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1e293b;line-height:1.7">
  <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="${PLATFORM_DEFAULTS.orgName}" style="height:56px;margin-bottom:20px"/>
  <h1 style="color:#dc2626;font-size:22px;margin:0 0 12px">Beauty &amp; wellness training is open for enrollment</h1>
  <p>Hi ${name},</p>
  <p>
    Great news — <strong>${PLATFORM_DEFAULTS.orgName}</strong> is <strong>open for enrollment</strong>
    in our <strong>${cfg.programTitle}</strong>. If you previously applied or requested information,
    this message is for you.
  </p>
  <p>
    <strong>Funding may be available if you qualify</strong> (WIOA, Workforce Ready Grant, and other
    Indiana workforce programs). Self-pay and payment plan options may also be available. WorkOne
    determines WIOA eligibility — not Elevate alone.
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
        <strong>${PLATFORM_DEFAULTS.orgName}</strong> for <strong>${cfg.programTitle}</strong>.
      </li>
      <li style="margin-bottom:10px">
        <strong>After you schedule your appointment, email us the date and time</strong> at
        <a href="mailto:${BEAUTY_ENROLLMENT_OPEN_REPLY_TO}" style="color:#dc2626">${BEAUTY_ENROLLMENT_OPEN_REPLY_TO}</a>
        so our enrollment team can follow up and keep your file active.
      </li>
      <li>
        <strong>Complete your application on our website</strong> when you are ready:
        <a href="${SITE_URL}${cfg.applyPath}" style="color:#dc2626">${SITE_URL}${cfg.applyPath}</a>
      </li>
    </ol>
  </div>

  <p style="font-size:14px">
    Program page: <a href="${SITE_URL}${cfg.programPath}" style="color:#dc2626">${SITE_URL}${cfg.programPath}</a><br/>
    Main website: <a href="${SITE_URL}" style="color:#dc2626">${SITE_URL}</a>
  </p>

  <p>Questions? Call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong> or reply to this email.</p>

  <p style="margin-top:28px">
    We look forward to working with you,<br/>
    <strong>${PLATFORM_DEFAULTS.orgName} Enrollment Team</strong><br/>
    <a href="mailto:${BEAUTY_ENROLLMENT_OPEN_REPLY_TO}">${BEAUTY_ENROLLMENT_OPEN_REPLY_TO}</a>
  </p>
</div>`;
}

export function buildBeautyEnrollmentOpenAdminRosterEmail(
  contacts: BeautyContactRow[],
  emailed: BeautyContactRow[],
  sendSummary: { sent: number; failed: number; skipped: number },
): string {
  const rowHtml = (r: BeautyContactRow) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.firstName)} ${escapeHtml(r.lastName)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0"><a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a></td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.phone || '—')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.city || '—')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.programLabel)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.status || '—')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(r.source)}</td>
    </tr>`;

  const byTrack = (track: BeautyTrack) =>
    contacts.filter((c) => c.track === track).length;

  return `
<div style="font-family:Arial,sans-serif;max-width:960px">
  <h1 style="color:#dc2626;font-size:20px">Esthetician, cosmetology &amp; nail tech — outreach sent</h1>
  <p>
    Applicant blast: <strong>${sendSummary.sent} sent</strong>,
    ${sendSummary.failed} failed, ${sendSummary.skipped} skipped (test/invalid).
    Combined unique contacts: <strong>${contacts.length}</strong>
    (esthetician: ${byTrack('esthetician')}, cosmetology: ${byTrack('cosmetology')}, nail: ${byTrack('nail')}).
  </p>
  <h2 style="font-size:16px;margin-top:24px">All contacts (applications + intake + leads)</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">
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
    <tbody>${contacts.map(rowHtml).join('')}</tbody>
  </table>
  <h2 style="font-size:16px;margin-top:28px">Emailed in this run (${emailed.length})</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">
    <thead>
      <tr style="background:#f1f5f9;text-align:left">
        <th style="padding:10px">Name</th>
        <th style="padding:10px">Email</th>
        <th style="padding:10px">Program</th>
      </tr>
    </thead>
    <tbody>${emailed.map(rowHtml).join('')}</tbody>
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
