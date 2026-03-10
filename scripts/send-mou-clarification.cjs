#!/usr/bin/env node
/**
 * Sends a clarification to all 4 program partners that the MOU pay amounts
 * are examples only and are based on actual participants enrolled.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

const recipients = [
  { email: 'anitabell85@gmail.com',       name: 'Anita Bell',           role: 'RN-BSN — CNA Program Lead' },
  { email: 'CarlinaWilkes@yahoo.com',     name: 'Carlina Wilkes',       role: 'Finance & Business Program Partner' },
  { email: 'sharen710@gmail.com',         name: 'Sharen Douglas-Brown', role: 'IT, CPR & Clinical Informatics Program Partner' },
  { email: 'Jozannageorge@outlook.com',   name: 'Jozanna George',       role: 'Beauty & Barbering Program Holder' },
];

function buildPayload(recipient) {
  const plain = [
    `Dear ${recipient.name.split(' ')[0]},`,
    '',
    'This is a follow-up to your onboarding email regarding the compensation examples',
    'included in your MOU structure.',
    '',
    'We want to make sure this is completely clear:',
    '',
    '─────────────────────────────────────────────',
    'IMPORTANT: THE AMOUNTS IN YOUR ONBOARDING EMAIL ARE EXAMPLES ONLY',
    '─────────────────────────────────────────────',
    '',
    'The dollar figures provided (tuition totals, cohort revenue, and your 1/3 share)',
    'were illustrative examples based on a full cohort.',
    '',
    'Your ACTUAL compensation is determined by:',
    '',
    '  • The number of participants actually enrolled in each cohort',
    '  • Actual tuition collected per enrolled student',
    '  • Actual credential partner fees and testing costs incurred',
    '',
    'EXAMPLE OF HOW IT SCALES:',
    '',
    '  If 10 students enroll (not 30):',
    '    Gross revenue = 10 × tuition rate',
    '    Minus actual deductions for those 10 students',
    '    Your 1/3 = based on net revenue from those 10 students only',
    '',
    '  If 30 students enroll (full cohort):',
    '    Gross revenue = 30 × tuition rate',
    '    Your 1/3 = the full example amount shown in your onboarding email',
    '',
    'There is no guaranteed minimum per cohort.',
    'Payment is always based on actual enrolled and completing participants.',
    '',
    'The formal MOU that Elizabeth will send you for e-signature will include',
    'the exact payment formula and terms.',
    '',
    'If you have any questions about compensation before signing the MOU,',
    'please contact Elizabeth directly:',
    '  Email: elevate4humanityedu@gmail.com',
    '  Phone: 317-314-3537',
    '',
    'Best regards,',
    'Elizabeth Greene',
    'Executive Director',
    'Elevate for Humanity | Workforce Credential Institute',
    'elevate4humanityedu@gmail.com | 317-314-3537',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;max-width:620px;">

  <tr><td style="background:#1e293b;padding:24px 32px;text-align:center;">
    <img src="cid:elevate_logo" alt="Elevate for Humanity" width="60" style="display:block;margin:0 auto 8px;">
    <p style="margin:0;color:#fff;font-size:17px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Workforce Credential Institute &nbsp;|&nbsp; DOL Sponsor &nbsp;|&nbsp; ETPL Listed</p>
  </td></tr>

  <tr><td style="background:#f97316;padding:14px 32px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:15px;font-weight:700;">Important Clarification — MOU Compensation Examples</p>
  </td></tr>

  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;">Dear ${recipient.name.split(' ')[0]},</p>
    <p style="margin:0 0 20px;line-height:1.7;">This is a follow-up to your onboarding email regarding the compensation figures included in your MOU structure. We want to make sure this is completely clear before you proceed.</p>

    <!-- IMPORTANT NOTICE -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#dc2626;">The amounts in your onboarding email are EXAMPLES ONLY.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#7f1d1d;">The dollar figures shown were based on a full cohort to illustrate how the 1/3 revenue-share model works. Your actual compensation depends entirely on the number of participants enrolled.</p>
    </td></tr></table>

    <!-- HOW IT ACTUALLY WORKS -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#f1f5f9;border-left:4px solid #1e293b;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;">Your actual compensation is determined by:</p>
      <ul style="margin:0 0 16px;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>The <strong>number of participants actually enrolled</strong> in each cohort</li>
        <li><strong>Actual tuition collected</strong> per enrolled student</li>
        <li><strong>Actual credential partner fees and testing costs</strong> incurred for those students</li>
      </ul>
      <p style="margin:0;font-size:13px;color:#64748b;font-style:italic;">There is no guaranteed minimum per cohort. Payment is always based on actual enrolled and completing participants.</p>
    </td></tr></table>

    <!-- SCALING EXAMPLE -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#fff7ed;border-left:4px solid #f97316;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;">How it scales with enrollment:</p>
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:12px;">
        <tr style="background:#1e293b;color:#fff;">
          <td style="padding:8px 12px;font-weight:700;">Enrolled Students</td>
          <td style="padding:8px 12px;font-weight:700;text-align:center;">Gross Revenue</td>
          <td style="padding:8px 12px;font-weight:700;text-align:center;">Your 1/3 Share</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">5 students</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e2e8f0;">5 × tuition rate</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e2e8f0;">1/3 of net after deductions</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">10 students</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e2e8f0;">10 × tuition rate</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e2e8f0;">1/3 of net after deductions</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">20 students</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e2e8f0;">20 × tuition rate</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e2e8f0;">1/3 of net after deductions</td>
        </tr>
        <tr style="background:#dcfce7;">
          <td style="padding:8px 12px;font-weight:700;color:#166534;">Full cohort (max)</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:#166534;">Max × tuition rate</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:#166534;">Full example amount</td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;color:#64748b;">The example amounts in your onboarding email represent a <strong>full cohort scenario</strong>. Actual earnings will vary based on enrollment each cycle.</p>
    </td></tr></table>

    <!-- MOU NOTE -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr><td style="background:#f1f5f9;border-left:4px solid #1e293b;padding:14px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0;font-size:14px;line-height:1.7;">The formal <strong>MOU (Memorandum of Understanding)</strong> that Elizabeth will send you for e-signature will include the exact payment formula, tuition rates, and terms. Please review it carefully before signing. If you have any questions about compensation before signing, contact Elizabeth directly.</p>
    </td></tr></table>

    <p style="margin:0;line-height:1.8;">Best regards,<br>
    <strong>Elizabeth Greene</strong><br>
    Executive Director<br>
    Elevate for Humanity | Workforce Credential Institute<br>
    <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a><br>
    elevate4humanityedu@gmail.com &nbsp;|&nbsp; 317-314-3537</p>
  </td></tr>

  <tr><td style="background:#f1f5f9;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.8;">
      Elevate for Humanity | Workforce Credential Institute<br>
      Indianapolis, Indiana &nbsp;|&nbsp; DOL Sponsor &nbsp;|&nbsp; ETPL Listed &nbsp;|&nbsp; WorkOne Partner
    </p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  return JSON.stringify({
    personalizations: [{
      to: [{ email: recipient.email, name: recipient.name }],
      cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
    }],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
    reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
    subject: 'Important Clarification: MOU Compensation Amounts Are Examples Based on Enrollment',
    content: [
      { type: 'text/plain', value: plain },
      { type: 'text/html',  value: html },
    ],
    attachments: [{
      content: logoBase64,
      filename: 'Elevate_for_Humanity_logo.jpg',
      type: 'image/jpeg',
      disposition: 'inline',
      content_id: 'elevate_logo',
    }],
  });
}

function send(recipient) {
  return new Promise((resolve, reject) => {
    const payload = buildPayload(recipient);
    const req = https.request({
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode === 202) {
          console.log(`✅ Sent to ${recipient.name} <${recipient.email}>`);
          resolve();
        } else {
          console.error(`❌ Failed for ${recipient.email} (${res.statusCode}):`, d);
          reject(new Error(d));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('Sending MOU clarification to all 4 program partners...\n');
  for (const r of recipients) {
    await send(r);
  }
  console.log('\n✅ All clarification emails sent. CC on each: elevate4humanityedu@gmail.com');
})();
