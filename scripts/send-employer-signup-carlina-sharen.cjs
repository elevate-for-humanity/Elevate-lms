#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const SIGNUP_URL   = 'https://www.elevateforhumanity.org/signup';
const EMPLOYER_URL = 'https://www.elevateforhumanity.org/employer-portal';
const VERIFY_URL   = 'https://www.elevateforhumanity.org/employer/verification';

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

function buildPayload(firstName, toEmail, toName) {
  const plain = [
    'Dear ' + firstName + ',',
    '',
    'This is a quick follow-up to your onboarding email.',
    '',
    'In addition to your Program Partner account, we need you to register each of your',
    'businesses separately as an Employer in the Elevate platform.',
    '',
    'This allows each business entity to:',
    '  - Post jobs and hire Elevate graduates',
    '  - Access WOTC (Work Opportunity Tax Credits)',
    '  - Participate in OJT (On-the-Job Training) reimbursement programs',
    '  - Appear in the Elevate employer directory for student placement',
    '  - Receive DOL apprenticeship sponsorship benefits',
    '',
    '─────────────────────────────────────────────',
    'HOW TO REGISTER EACH BUSINESS',
    '─────────────────────────────────────────────',
    '',
    'IMPORTANT: Each business must be registered as a SEPARATE employer account.',
    'Do not combine multiple businesses under one account.',
    '',
    'For each business:',
    '',
    'STEP 1 — Create an employer account',
    '  Go to: ' + SIGNUP_URL,
    '  Select role: Employer',
    '  Use the business email address for that specific company',
    '  Enter the legal business name exactly as it appears on your EIN/tax documents',
    '',
    'STEP 2 — Complete employer verification',
    '  Go to: ' + VERIFY_URL,
    '  Upload:',
    '    - EIN confirmation letter (IRS CP 575 or 147C)',
    '    - Business license or Articles of Incorporation',
    '    - Government-issued ID of the authorized representative',
    '',
    'STEP 3 — Set up your employer profile',
    '  Go to: ' + EMPLOYER_URL,
    '  Complete your company profile:',
    '    - Business name, address, and contact information',
    '    - Industry and number of employees',
    '    - Types of positions you hire for',
    '    - WOTC eligibility preferences',
    '',
    'STEP 4 — Repeat for each additional business',
    '  Use a different email address for each business entity.',
    '  Each account is tied to one EIN.',
    '',
    '─────────────────────────────────────────────',
    'WHY REGISTER EACH BUSINESS SEPARATELY?',
    '─────────────────────────────────────────────',
    '',
    '  - WOTC credits are tracked per EIN — combining businesses loses credits',
    '  - OJT reimbursements are paid per employer agreement, per business',
    '  - DOL apprenticeship records are tied to the specific employer EIN',
    '  - Separate profiles allow each business to post jobs independently',
    '',
    '─────────────────────────────────────────────',
    'QUESTIONS?',
    '─────────────────────────────────────────────',
    '',
    'Elizabeth Greene',
    'elevate4humanityedu@gmail.com',
    '317-314-3537',
    'www.elevateforhumanity.org',
    '',
    'Best regards,',
    'Elizabeth Greene',
    'Executive Director',
    'Elevate for Humanity | Workforce Credential Institute',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;max-width:620px;">

  <tr><td style="background:#1e293b;padding:28px 32px;text-align:center;">
    <img src="cid:elevate_logo" alt="Elevate for Humanity" width="64" style="display:block;margin:0 auto 10px;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Workforce Credential Institute &nbsp;|&nbsp; DOL Sponsor &nbsp;|&nbsp; ETPL Listed</p>
  </td></tr>

  <tr><td style="background:#dc2626;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">Action Required: Register Each Business as an Employer</p>
  </td></tr>

  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;">Dear ${firstName},</p>
    <p style="margin:0 0 20px;line-height:1.7;">This is a quick follow-up to your onboarding email. In addition to your Program Partner account, we need you to <strong>register each of your businesses separately as an Employer</strong> in the Elevate platform.</p>

    <!-- WHY -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#f1f5f9;border-left:4px solid #1e293b;padding:16px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:700;">Registering as an employer gives each business access to:</p>
      <ul style="margin:0;padding-left:20px;line-height:1.9;font-size:14px;">
        <li>Post jobs and hire Elevate graduates directly</li>
        <li><strong>WOTC</strong> — Work Opportunity Tax Credits (up to $9,600 per eligible hire)</li>
        <li><strong>OJT reimbursement</strong> — get reimbursed for on-the-job training wages</li>
        <li>Appear in the Elevate employer directory for student placement</li>
        <li>DOL apprenticeship sponsorship benefits</li>
      </ul>
    </td></tr></table>

    <!-- IMPORTANT NOTICE -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#dc2626;">&#9888; Each business must be registered as a SEPARATE employer account.</p>
      <p style="margin:6px 0 0;font-size:14px;color:#7f1d1d;">Do not combine multiple businesses under one account. Each account is tied to one EIN.</p>
    </td></tr></table>

    <!-- STEPS -->
    <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#dc2626;">FOR EACH BUSINESS &#8212; Complete These Steps</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">1</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Create an Employer Account</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.7;">Go to the signup page, select <strong>Employer</strong> as your role, and use the <strong>business email address</strong> for that specific company. Enter the legal business name exactly as it appears on your EIN/tax documents.</p>
        <a href="${SIGNUP_URL}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Sign Up as Employer &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">2</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Complete Employer Verification</p>
        <ul style="margin:0 0 10px;padding-left:20px;font-size:14px;line-height:1.9;">
          <li>EIN confirmation letter (IRS CP 575 or 147C)</li>
          <li>Business license or Articles of Incorporation</li>
          <li>Government-issued ID of the authorized representative</li>
        </ul>
        <a href="${VERIFY_URL}" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to Verification &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">3</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Set Up Your Employer Profile</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.7;">Complete your company profile including business name, address, industry, number of employees, types of positions you hire for, and WOTC eligibility preferences.</p>
        <a href="${EMPLOYER_URL}" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to Employer Portal &#8594;</a>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td width="44" valign="top"><div style="width:36px;height:36px;background:#dc2626;border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">4</div></td>
      <td style="padding-left:12px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:15px;">Repeat for Each Additional Business</p>
        <p style="margin:0;font-size:14px;line-height:1.7;">Use a <strong>different email address</strong> for each business entity and repeat Steps 1&#8211;3. Each account is tied to one EIN.</p>
      </td>
    </tr></table>

    <!-- WHY SEPARATE -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr><td style="background:#fff7ed;border-left:4px solid #f97316;padding:14px 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;">Why register each business separately?</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.9;">
        <li>WOTC credits are tracked per EIN &#8212; combining businesses loses credits</li>
        <li>OJT reimbursements are paid per employer agreement, per business</li>
        <li>DOL apprenticeship records are tied to the specific employer EIN</li>
        <li>Separate profiles allow each business to post jobs independently</li>
      </ul>
    </td></tr></table>

    <p style="margin:0;line-height:1.8;">Best regards,<br>
    <strong>Elizabeth Greene</strong><br>
    Executive Director<br>
    Elevate for Humanity | Workforce Credential Institute<br>
    <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a><br>
    elevate4humanityedu@gmail.com &nbsp;|&nbsp; 317-314-3537</p>
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

  return JSON.stringify({
    personalizations: [{
      to: [{ email: toEmail, name: toName }],
      cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
    }],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
    reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
    subject: 'Action Required: Register Each Business as an Employer — Elevate for Humanity',
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

function send(firstName, toEmail, toName) {
  return new Promise((resolve, reject) => {
    const payload = buildPayload(firstName, toEmail, toName);
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
          console.log(`✅ Delivered to ${toEmail} (${toName})`);
          console.log(`   CC: elevate4humanityedu@gmail.com`);
          console.log(`   Timestamp: ${new Date().toISOString()}`);
          resolve();
        } else {
          console.error(`❌ Failed for ${toEmail} (${res.statusCode}):`, d);
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
  await send('Carlina', 'CarlinaWilkes@yahoo.com', 'Carlina Wilkes');
  await send('Sharen', 'sharen710@gmail.com', 'Sharen Douglas-Brown');
})();
