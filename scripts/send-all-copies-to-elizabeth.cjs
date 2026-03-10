#!/usr/bin/env node
/**
 * Sends Elizabeth a summary copy of all emails sent today
 * with the full content of each email listed in one digest
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

const emails = [
  {
    to: 'info@hooverwood.org',
    name: 'Evan — Hooverwood Living',
    subject: 'Re: CNA Clinical Training Partnership — Elevate for Humanity',
    sent: '2026-03-09 @ 10:37 PM UTC',
    summary: 'Reply to Evan at Hooverwood Living accepting the meeting request to discuss CNA clinical training partnership and clinical placement opportunities. Offered virtual or in-person meeting, asked for available times.',
  },
  {
    to: 'anitabell85@gmail.com',
    name: 'Anita Bell',
    subject: 'Welcome to Elevate for Humanity — CNA Program Onboarding & Next Steps',
    sent: '2026-03-09 @ 10:37 PM UTC (resent 11:05 PM UTC with corrected title)',
    summary: 'Onboarding email for Anita Bell as RN-BSN Program Lead over the CNA Training Program. Included: role responsibilities (clinical oversight, curriculum, credentialing, compliance), MOU 1/3 pay structure (~$22,617/cohort after deductions from $75,000 gross), and 5 action steps: Create Account → Onboarding docs (RN-BSN license, NPI, W-9, CPR cert) → Payroll/Direct Deposit → Sign MOU → Confirm start date.',
  },
  {
    to: 'CarlinaWilkes@yahoo.com',
    name: 'Carlina Wilkes',
    subject: 'Welcome to Elevate for Humanity — Finance & Business Program Partner Onboarding',
    sent: '2026-03-09 @ 10:48 PM UTC',
    summary: 'Onboarding email for Carlina Wilkes as Program Partner over Finance & Business programs. Included: role responsibilities (program delivery, credentialing — QuickBooks/Notary/Tax Prep/Business Office, compliance), MOU 1/3 pay structure (~$11,333/cohort after deductions from $37,500 gross), and 6 action steps: Apply → Create Account → Onboarding docs → Payroll → Sign MOU → Confirm start date.',
  },
  {
    to: 'sharen710@gmail.com',
    name: 'Sharen Douglas-Brown',
    subject: 'Welcome to Elevate for Humanity — IT, CPR & Clinical Informatics Program Partner Onboarding',
    sent: '2026-03-09 @ 10:59 PM UTC',
    summary: 'Onboarding email for Sharen Douglas-Brown as Program Partner over IT, CPR, and Clinical Informatics programs. Included: role responsibilities (program delivery, credentialing — CompTIA A+/ITF+/Google IT, AHA BLS/CPR, EHR Specialist, compliance/HIPAA), MOU 1/3 pay structure (IT: ~$13,500/cohort; CPR: ~$400/class), and 6 action steps: Apply → Create Account → Onboarding docs (CPR instructor cert, IT certs) → Payroll → Sign MOU → Confirm start date.',
  },
  {
    to: 'Cldamd.davis@gmail.com',
    name: 'Alberta Davis',
    subject: 'Welcome to Elevate for Humanity — Testing Center Coordinator Onboarding',
    sent: '2026-03-09 @ 11:04 PM UTC',
    summary: 'Onboarding email for Alberta Davis as Testing Center Coordinator & Exam Proctor (Staff/Employee). Included: 5 responsibilities from her bio (testing coordination, exam proctoring, partner events, training room oversight, compliance), bi-weekly employee payroll structure, and 5 action steps: Create Staff Account → Onboarding docs (ID, W-9, proctor certs) → Payroll/Direct Deposit → Sign Staff Agreement → Confirm start date.',
  },
  {
    to: 'CarlinaWilkes@yahoo.com + sharen710@gmail.com',
    name: 'Carlina Wilkes & Sharen Douglas-Brown',
    subject: 'Action Required: Register Each Business as an Employer — Elevate for Humanity',
    sent: '2026-03-09 @ 11:09 PM UTC',
    summary: 'Employer registration instructions sent to both Carlina and Sharen. Instructed each to register every business separately (one account per EIN). Included: why separate accounts matter (WOTC credits per EIN, OJT reimbursements per employer agreement, DOL records per EIN), and 4 steps: Sign Up as Employer → Verification (EIN docs, business license, ID) → Complete Employer Profile → Repeat for each additional business.',
  },
];

const rows = emails.map((e, i) => `
  <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'};">
    <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
      <p style="margin:0;font-weight:700;font-size:14px;color:#1e293b;">${e.name}</p>
      <p style="margin:2px 0 0;font-size:12px;color:#64748b;">${e.to}</p>
    </td>
    <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#1e293b;">${e.subject}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#475569;line-height:1.6;">${e.summary}</p>
      <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;">Sent: ${e.sent}</p>
    </td>
  </tr>`).join('');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;max-width:680px;">

  <tr><td style="background:#1e293b;padding:28px 32px;text-align:center;">
    <img src="cid:elevate_logo" alt="Elevate for Humanity" width="64" style="display:block;margin:0 auto 10px;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Workforce Credential Institute &nbsp;|&nbsp; DOL Sponsor &nbsp;|&nbsp; ETPL Listed</p>
  </td></tr>

  <tr><td style="background:#dc2626;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">Email Delivery Summary &#8212; All Outreach Sent Today</p>
    <p style="margin:4px 0 0;color:#fecaca;font-size:13px;">For Elizabeth Greene &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
  </td></tr>

  <tr><td style="padding:32px;">
    <p style="margin:0 0 20px;line-height:1.7;">Elizabeth, below is a complete record of all emails sent on your behalf today. <strong>${emails.length} emails</strong> were delivered to <strong>6 recipients</strong>. Each email was CC&#8217;d to you at the time of sending.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:28px;">
      <tr style="background:#1e293b;">
        <td style="padding:12px 16px;color:#fff;font-weight:700;font-size:13px;width:200px;">Recipient</td>
        <td style="padding:12px 16px;color:#fff;font-weight:700;font-size:13px;">Email &amp; Summary</td>
      </tr>
      ${rows}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr><td style="background:#f1f5f9;border-left:4px solid #1e293b;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 10px;font-weight:700;font-size:14px;">Next Steps to Watch For</p>
      <ul style="margin:0;padding-left:20px;line-height:1.9;font-size:14px;">
        <li><strong>Evan (Hooverwood)</strong> — Awaiting reply with available meeting times</li>
        <li><strong>Anita Bell</strong> — Should complete signup, onboarding docs, and payroll setup</li>
        <li><strong>Carlina Wilkes</strong> — Should complete partner application, signup, onboarding, and payroll</li>
        <li><strong>Sharen Douglas-Brown</strong> — Should complete partner application, signup, onboarding, and payroll</li>
        <li><strong>Alberta Davis</strong> — Should complete staff signup, onboarding docs, and payroll setup</li>
        <li><strong>Carlina &amp; Sharen</strong> — Should register each business separately as an employer</li>
      </ul>
    </td></tr></table>

    <p style="margin:0;line-height:1.8;">Best regards,<br>
    <strong>Elevate for Humanity Platform</strong><br>
    <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a></p>
  </td></tr>

  <tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.8;">
      Elevate for Humanity | Workforce Credential Institute<br>
      Indianapolis, Indiana &nbsp;|&nbsp; DOL Sponsor &nbsp;|&nbsp; ETPL Listed &nbsp;|&nbsp; WorkOne Partner<br>
      <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a>
    </p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

const plain = [
  'EMAIL DELIVERY SUMMARY — ALL OUTREACH SENT TODAY',
  'For Elizabeth Greene | ' + new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
  '',
  emails.length + ' emails delivered to 6 recipients. Each was CC\'d to you at time of sending.',
  '',
  ...emails.map((e, i) => [
    '─────────────────────────────────────────────',
    (i+1) + '. TO: ' + e.name + ' <' + e.to + '>',
    '   SUBJECT: ' + e.subject,
    '   SENT: ' + e.sent,
    '   SUMMARY: ' + e.summary,
    '',
  ].join('\n')),
  'NEXT STEPS TO WATCH FOR:',
  '  - Evan (Hooverwood): Awaiting reply with available meeting times',
  '  - Anita Bell: Should complete signup, onboarding docs, and payroll',
  '  - Carlina Wilkes: Should complete partner application, signup, onboarding, payroll',
  '  - Sharen Douglas-Brown: Should complete partner application, signup, onboarding, payroll',
  '  - Alberta Davis: Should complete staff signup, onboarding docs, and payroll',
  '  - Carlina & Sharen: Should register each business separately as employer',
].join('\n');

const payload = JSON.stringify({
  personalizations: [{
    to: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
  }],
  from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity Platform' },
  reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
  subject: 'Email Delivery Summary — All Outreach Sent Today (' + new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) + ')',
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
      console.log('✅ Delivery summary sent to elevate4humanityedu@gmail.com');
      console.log('   Covers ' + emails.length + ' emails to 6 recipients');
      console.log('   Timestamp:', new Date().toISOString());
    } else {
      console.error('❌ Failed (' + res.statusCode + '):', d);
      process.exit(1);
    }
  });
});
req.on('error', e => { console.error(e); process.exit(1); });
req.write(payload);
req.end();
