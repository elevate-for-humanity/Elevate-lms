#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

const plain = [
  'Dear Alberta,',
  '',
  'Here is exactly what to do:',
  '',
  '1. Go to: https://www.elevateforhumanity.org/signup',
  '2. Enter your name and email: Cldamd.davis@gmail.com',
  '3. Create a password (8+ characters)',
  '4. Where it says "I am signing up as a" — select: Staff / Employee',
  '5. Check the terms box and click Create Account',
  '6. Check your email for a verification link and click it.',
  '   You will be taken directly to your Staff Onboarding portal automatically.',
  '',
  'If you have any trouble call Elizabeth directly: 317-314-3537',
  '',
  'We sincerely apologize for the inconvenience.',
  '',
  'Best regards,',
  'Elizabeth Greene',
  'Executive Director, Elevate for Humanity',
  '317-314-3537',
].join('\n');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;max-width:560px;">

  <tr><td style="background:#1e293b;padding:24px 32px;text-align:center;">
    <img src="cid:elevate_logo" alt="Elevate for Humanity" width="60" style="display:block;margin:0 auto 8px;">
    <p style="margin:0;color:#fff;font-size:17px;font-weight:700;">Elevate for Humanity</p>
  </td></tr>

  <tr><td style="background:#dc2626;padding:12px 32px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:15px;font-weight:700;">Alberta &#8212; Here Is Exactly What To Do</p>
  </td></tr>

  <tr><td style="padding:32px;color:#1e293b;">
    <p style="margin:0 0 20px;line-height:1.7;">We are sorry for the repeated trouble. The signup is now fully fixed. Please follow these exact steps:</p>

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
        <td style="padding-left:12px;font-size:14px;line-height:1.7;">Enter your name and email: <strong>Cldamd.davis@gmail.com</strong><br>Create a password (8+ characters)</td>
      </tr></table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td width="32" valign="top"><div style="width:26px;height:26px;background:#dc2626;border-radius:50%;text-align:center;line-height:26px;color:#fff;font-weight:700;font-size:13px;">3</div></td>
        <td style="padding-left:12px;font-size:14px;line-height:1.7;">Where it says <strong>&#8220;I am signing up as a&#8221;</strong><br>
        Select: <strong style="color:#dc2626;font-size:16px;">Staff / Employee</strong></td>
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
        You will be taken directly to your <strong>Staff Onboarding portal</strong> automatically.</td>
      </tr></table>

    </td></tr></table>

    <div style="text-align:center;margin:0 0 24px;">
      <a href="https://www.elevateforhumanity.org/signup" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px;">Go to Signup Page &#8594;</a>
    </div>

    <p style="margin:0 0 6px;font-size:14px;line-height:1.7;">If you have any trouble at all, call Elizabeth directly: <strong>317-314-3537</strong></p>
    <p style="margin:0 0 28px;font-size:14px;">We sincerely apologize for the inconvenience, Alberta.</p>

    <p style="margin:0;line-height:1.8;font-size:14px;">Best regards,<br>
    <strong>Elizabeth Greene</strong><br>
    Executive Director, Elevate for Humanity<br>
    317-314-3537</p>
  </td></tr>

  <tr><td style="background:#f1f5f9;padding:14px 32px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;font-size:11px;color:#64748b;">Elevate for Humanity | Indianapolis, Indiana | DOL Sponsor | ETPL Listed</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

const payload = JSON.stringify({
  personalizations: [{
    to: [{ email: 'Cldamd.davis@gmail.com', name: 'Alberta Davis' }],
    cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
  }],
  from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
  reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
  subject: 'Alberta — Signup Is Fixed, Here Are Your Exact Steps',
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
      console.log('✅ Sent to Cldamd.davis@gmail.com (Alberta Davis)');
      console.log('   CC: elevate4humanityedu@gmail.com');
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
