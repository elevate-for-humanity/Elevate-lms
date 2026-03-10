#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

const people = [
  {
    name: 'Alberta Davis',
    email: 'Cldamd.davis@gmail.com',
    role: 'Staff / Employee',
    roleValue: 'staff',
    landsOn: 'Staff Onboarding Portal',
    extra: 'You will complete your orientation, handbook acknowledgment, payroll/direct deposit setup, and skills profile.',
  },
  {
    name: 'Anita Bell',
    email: 'anitabell85@gmail.com',
    role: 'Program Partner / Instructor',
    roleValue: 'partner',
    landsOn: 'Partner Onboarding Portal',
    extra: 'You will complete your partner application, upload your RN-BSN license and documents, and set up payroll.',
  },
  {
    name: 'Carlina Wilkes',
    email: 'CarlinaWilkes@yahoo.com',
    role: 'Program Partner / Instructor',
    roleValue: 'partner',
    landsOn: 'Partner Onboarding Portal',
    extra: 'You will complete your partner application, upload your documents, and set up payroll.',
  },
  {
    name: 'Sharen Douglas-Brown',
    email: 'sharen710@gmail.com',
    role: 'Program Partner / Instructor',
    roleValue: 'partner',
    landsOn: 'Partner Onboarding Portal',
    extra: 'You will complete your partner application, upload your CPR instructor cert and IT credentials, and set up payroll.',
  },
  {
    name: 'Jozanna George',
    email: 'Jozannageorge@outlook.com',
    role: 'Program Partner / Instructor',
    roleValue: 'partner',
    landsOn: 'Partner Onboarding Portal',
    extra: 'You will complete your partner application, upload your Indiana beauty licenses, and set up payroll.',
  },
];

function buildPayload(p) {
  const firstName = p.name.split(' ')[0];

  const plain = [
    `Dear ${firstName},`,
    '',
    'The Elevate for Humanity signup portal has been updated and is ready for you.',
    'Please follow these exact steps to create your account:',
    '',
    '─────────────────────────────────────────────',
    'YOUR SIGNUP STEPS',
    '─────────────────────────────────────────────',
    '',
    `STEP 1 — Go to: https://www.elevateforhumanity.org/signup`,
    '',
    `STEP 2 — Enter your name and email: ${p.email}`,
    '         Create a password (8+ characters)',
    '',
    `STEP 3 — Where it says "I am signing up as a"`,
    `         Select: ${p.role}`,
    '',
    'STEP 4 — Check the terms box and click Create Account',
    '',
    'STEP 5 — Check your email for a verification link and click it',
    `         You will be taken directly to your ${p.landsOn} automatically.`,
    '',
    `WHAT HAPPENS NEXT:`,
    p.extra,
    '',
    'If you have any trouble, call Elizabeth directly: 317-314-3537',
    '',
    'Best regards,',
    'Elizabeth Greene',
    'Executive Director, Elevate for Humanity',
    '317-314-3537 | elevate4humanityedu@gmail.com',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;max-width:580px;">

  <tr><td style="background:#1e293b;padding:24px 32px;text-align:center;">
    <img src="cid:elevate_logo" alt="Elevate for Humanity" width="60" style="display:block;margin:0 auto 8px;">
    <p style="margin:0;color:#fff;font-size:17px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Workforce Credential Institute</p>
  </td></tr>

  <tr><td style="background:#dc2626;padding:12px 32px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:15px;font-weight:700;">${firstName} &#8212; Your Signup Steps</p>
  </td></tr>

  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;">Dear ${firstName},</p>
    <p style="margin:0 0 20px;line-height:1.7;">The Elevate signup portal is ready. Please follow these exact steps:</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#f1f5f9;border-left:4px solid #dc2626;padding:18px 20px;border-radius:0 6px 6px 0;">

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td width="32" valign="top"><div style="width:26px;height:26px;background:#dc2626;border-radius:50%;text-align:center;line-height:26px;color:#fff;font-weight:700;font-size:13px;">1</div></td>
        <td style="padding-left:12px;font-size:14px;line-height:1.7;"><strong>Go to the signup page:</strong><br>
        <a href="https://www.elevateforhumanity.org/signup" style="color:#dc2626;font-weight:700;">www.elevateforhumanity.org/signup</a></td>
      </tr></table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td width="32" valign="top"><div style="width:26px;height:26px;background:#dc2626;border-radius:50%;text-align:center;line-height:26px;color:#fff;font-weight:700;font-size:13px;">2</div></td>
        <td style="padding-left:12px;font-size:14px;line-height:1.7;">Enter your name and email: <strong>${p.email}</strong><br>Create a password (8+ characters)</td>
      </tr></table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td width="32" valign="top"><div style="width:26px;height:26px;background:#dc2626;border-radius:50%;text-align:center;line-height:26px;color:#fff;font-weight:700;font-size:13px;">3</div></td>
        <td style="padding-left:12px;font-size:14px;line-height:1.7;">Where it says <strong>&#8220;I am signing up as a&#8221;</strong><br>
        Select: <strong style="color:#dc2626;font-size:15px;">${p.role}</strong></td>
      </tr></table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td width="32" valign="top"><div style="width:26px;height:26px;background:#dc2626;border-radius:50%;text-align:center;line-height:26px;color:#fff;font-weight:700;font-size:13px;">4</div></td>
        <td style="padding-left:12px;font-size:14px;line-height:1.7;">Check the terms box and click <strong>Create Account</strong></td>
      </tr></table>

      <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="32" valign="top"><div style="width:26px;height:26px;background:#dc2626;border-radius:50%;text-align:center;line-height:26px;color:#fff;font-weight:700;font-size:13px;">5</div></td>
        <td style="padding-left:12px;font-size:14px;line-height:1.7;"><strong>Check your email</strong> for a verification link and click it.<br>
        You will land directly on your <strong>${p.landsOn}</strong>.</td>
      </tr></table>

    </td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="background:#fff7ed;border-left:4px solid #f97316;padding:14px 18px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 6px;font-weight:700;font-size:14px;">What happens after you verify:</p>
      <p style="margin:0;font-size:14px;line-height:1.7;">${p.extra}</p>
    </td></tr></table>

    <div style="text-align:center;margin:0 0 24px;">
      <a href="https://www.elevateforhumanity.org/signup" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px;">Create Your Account &#8594;</a>
    </div>

    <p style="margin:0 0 6px;font-size:14px;">Any trouble? Call Elizabeth: <strong>317-314-3537</strong></p>
    <p style="margin:0;line-height:1.8;font-size:14px;">Best regards,<br>
    <strong>Elizabeth Greene</strong><br>Executive Director, Elevate for Humanity</p>
  </td></tr>

  <tr><td style="background:#f1f5f9;padding:14px 32px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;font-size:11px;color:#64748b;">Elevate for Humanity | Indianapolis, Indiana | DOL Sponsor | ETPL Listed</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  return JSON.stringify({
    personalizations: [{
      to: [{ email: p.email, name: p.name }],
      cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
    }],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
    reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
    subject: `${firstName} — Your Elevate Account Signup Steps`,
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

function send(person) {
  return new Promise((resolve, reject) => {
    const payload = buildPayload(person);
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
          console.log(`✅ ${person.name} <${person.email}>`);
          resolve();
        } else {
          console.error(`❌ ${person.email} (${res.statusCode}):`, d);
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
  console.log('Sending signup instructions...\n');
  for (const p of people) {
    await send(p);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\n✅ All sent. CC on each: elevate4humanityedu@gmail.com');
})();
