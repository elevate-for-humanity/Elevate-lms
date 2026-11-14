import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const CNA_ENROLLMENT_OPEN_REPLY_TO = 'elevate4humanityedu@gmail.com';
export const ICC_URL = 'https://www.indianacareerconnect.com';
export const WORKONE_LOCATOR_URL = 'https://www.workone.in.gov/';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

export type CnaContactRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  source: string;
  createdAt: string;
};

export function buildCnaEnrollmentOpenApplicantEmail(firstName: string): string {
  const name = firstName.trim() || 'there';
  return `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1e293b;line-height:1.7">
  <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="${PLATFORM_DEFAULTS.orgName}" style="height:56px;margin-bottom:20px"/>
  <h1 style="color:#059669;font-size:22px;margin:0 0 12px">CNA Training — Special Offer for July!</h1>
  <p>Hi ${name},</p>
  <p>
    <strong>Special July Offer!</strong> Our CNA (Certified Nursing Assistant) training is now <strong>open for enrollment</strong> at the incredible price of <strong style="color:#dc2626;font-size:20px">$1,850</strong> (regularly $2,500+).
  </p>
  
  <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:10px;padding:20px;margin:24px 0;text-align:center">
    <p style="margin:0;font-size:14px;color:#92400e"><strong>Use Coupon Code:</strong></p>
    <p style="margin:8px 0 0;font-size:28px;font-weight:bold;color:#dc2626;letter-spacing:2px">CNAJULY</p>
    <p style="margin:8px 0 0;font-size:16px;color:#92400e">Get <strong>$650 off</strong> your CNA training!</p>
  </div>

  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;margin:24px 0">
    <h2 style="color:#166534;font-size:16px;margin:0 0 12px">Why CNA Training?</h2>
    <ul style="margin:0;padding-left:20px;color:#166534">
      <li style="margin-bottom:8px">Start your healthcare career in just 6 weeks</li>
      <li style="margin-bottom:8px">Job placement assistance included</li>
      <li style="margin-bottom:8px">Funding available through WIOA if eligible</li>
      <li>Average CNA salary: $28,000-$35,000/year in Indiana</li>
    </ul>
  </div>

  <h2 style="color:#1e293b;font-size:16px;margin:24px 0 12px">Payment Options</h2>
  <ul style="margin:0;padding-left:20px">
    <li style="margin-bottom:8px"><strong>Self-Pay:</strong> $1,850 with coupon code CNAJULY</li>
    <li style="margin-bottom:8px"><strong>Payment Plan:</strong> As low as $75/week with BNPL</li>
    <li style="margin-bottom:8px"><strong>WIOA Funding:</strong> May be FREE if eligible (visit WorkOne)</li>
  </ul>

  <div style="background:#f1f5f9;border-radius:10px;padding:20px;margin:24px 0">
    <h2 style="color:#1e293b;font-size:16px;margin:0 0 12px">Your Next Steps</h2>
    <ol style="margin:0;padding-left:20px">
      <li style="margin-bottom:10px">Apply now with code <strong>CNAJULY</strong> for $650 off</li>
      <li style="margin-bottom:10px">Or visit WorkOne first to check funding eligibility: <a href="${WORKONE_LOCATOR_URL}" style="color:#059669">${WORKONE_LOCATOR_URL}</a></li>
      <li>Questions? Call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong></li>
    </ol>
  </div>

  <p style="margin-top:24px">
    <a href="${SITE_URL}/apply?program=cna" style="background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Apply Now with CNAJULY →</a>
  </p>

  <p style="margin-top:28px">
    Start your nursing career,<br/>
    <strong>${PLATFORM_DEFAULTS.orgName} Enrollment Team</strong>
  </p>
</div>`;
}

export function buildCnaEnrollmentOpenAdminRosterEmail(
  contacts: CnaContactRow[],
  sendSummary: { sent: number; failed: number; skipped: number },
): string {
  const rows = contacts.map((c) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0"><a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a></td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(c.phone || '—')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(c.source)}</td>
    </tr>`).join('');

  return `
<div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;color:#1e293b">
  <h1 style="color:#059669;font-size:20px">CNA enrollment open — outreach sent</h1>
  <p><strong>${sendSummary.sent} sent</strong>, ${sendSummary.failed} failed, ${sendSummary.skipped} skipped</p>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead>
      <tr style="background:#f1f5f9;text-align:left">
        <th style="padding:10px">Name</th>
        <th style="padding:10px">Email</th>
        <th style="padding:10px">Phone</th>
        <th style="padding:10px">Source</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
