#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

const body = `Dear Evan,

Thank you for reaching out. I appreciate your willingness to connect and would welcome the opportunity to speak with you.

I would be glad to schedule a meeting with your team to discuss a potential partnership between Hooverwood Living and Elevate for Humanity regarding our CNA training program and clinical placement opportunities.

Please let me know a few times that work best for your schedule this week, and I will coordinate accordingly. I am also happy to meet virtually or in person, whichever is most convenient for you and your team.

I look forward to the conversation and learning more about Hooverwood Living's workforce needs and how we can collaborate to support the development of future healthcare professionals.

Best regards,
Elizabeth Greene
Executive Director
Elevate for Humanity | Workforce Credential Institute
www.elevateforhumanity.org
elevate4humanityedu@gmail.com
317-314-3537`;

function buildHtml(text) {
  const paras = text.split('\n\n').filter(p => p.trim())
    .map(p => `<p style="margin:0 0 16px 0;color:#1e293b;">${p.trim().replace(/\n/g,'<br>')}</p>`)
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#1e293b;padding:24px 32px;text-align:center;">
  <img src="cid:elevate_logo" alt="Elevate for Humanity" width="60" style="display:block;margin:0 auto 8px;">
  <p style="margin:0;color:#ffffff;font-size:14px;font-weight:700;">Elevate for Humanity</p>
  <p style="margin:4px 0 0;color:#64748b;font-size:11px;">DOL Sponsor &nbsp;|&nbsp; WorkOne Partner &nbsp;|&nbsp; Workforce Credential Institute</p>
</td></tr>
<tr><td style="padding:32px;"><div style="font-size:15px;line-height:1.7;">${paras}</div></td></tr>
<tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:12px;color:#64748b;">
    <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a> &nbsp;|&nbsp;
    <a href="mailto:elevate4humanityedu@gmail.com" style="color:#dc2626;">elevate4humanityedu@gmail.com</a> &nbsp;|&nbsp;
    317-314-3537
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

const payload = JSON.stringify({
  personalizations: [{
    to: [{ email: 'info@hooverwood.org', name: 'Evan — Hooverwood Living' }],
    cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
  }],
  from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
  reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
  subject: 'Re: CNA Clinical Training Partnership — Elevate for Humanity',
  content: [
    { type: 'text/plain', value: body },
    { type: 'text/html', value: buildHtml(body) },
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
      console.log('✅ Delivered to info@hooverwood.org (Evan)');
      console.log('   CC: elevate4humanityedu@gmail.com');
      console.log('   Timestamp:', new Date().toISOString());
    } else {
      console.log('❌ Failed (' + res.statusCode + '):', d);
    }
  });
});
req.on('error', console.error);
req.write(payload);
req.end();
