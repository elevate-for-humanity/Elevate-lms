#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const logoBase64 = fs.readFileSync(path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')).toString('base64');

const body = `Dear Hooverwood Living Leadership Team,

My name is Elizabeth Greene, and I serve as Executive Director of Elevate for Humanity. We are a workforce training and credentialing organization based in Indianapolis focused on preparing individuals for high-demand healthcare careers through structured training pathways and industry-recognized credentials.

Elevate for Humanity operates a Workforce Credential Institute that delivers healthcare training aligned with employer needs and workforce development programs. We are a U.S. Department of Labor (DOL) sponsor and work in partnership with WorkOne Indiana, which allows us to connect participants with no-cost career services and workforce funding resources. Our organization is affiliated with several nationally recognized credentialing and workforce partners, and we provide training pathways that connect participants to certifications and employment in healthcare support roles.

We are currently expanding our Certified Nursing Assistant (CNA) training pathway and are seeking to establish clinical partnerships with respected healthcare providers in the Indianapolis area. Hooverwood Living's reputation for quality care and community service makes your organization an ideal partner for this effort.

Through this partnership, Elevate for Humanity would provide the classroom and instructional portion of the CNA training program, while Hooverwood Living would serve as a clinical training site where students can complete their required hands-on clinical hours under appropriate supervision. This collaboration would allow participants to gain real-world experience in a professional care environment while also helping strengthen the pipeline of trained healthcare workers entering the field.

Our goal is to build a long-term workforce partnership that benefits both students and healthcare providers. Many of our participants are seeking immediate employment opportunities after completing their training, and partnerships with facilities like Hooverwood Living help create direct pathways into the workforce.

We would welcome the opportunity to speak with your leadership team about how we could structure a clinical training partnership that aligns with your facility's needs and capacity. I would be happy to provide program details, curriculum outlines, and compliance documentation for review.

Thank you for your time and consideration. I look forward to the possibility of working together to support healthcare workforce development in our community.

Sincerely,
Elizabeth Greene
Executive Director
Elevate for Humanity | Workforce Credential Institute
www.elevateforhumanity.org
elevate4humanityedu@gmail.com
(317) 314-3537`;

function buildHtml(text) {
  const paras = text.split('\n\n').filter(p => p.trim())
    .map(p => `<p style="margin:0 0 16px 0;color:#1e293b;">${p.trim().replace(/\n/g,'<br>')}</p>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#1e293b;padding:24px 32px;text-align:center;">
  <img src="cid:elevate_logo" alt="Elevate for Humanity" width="60" style="display:block;margin:0 auto 8px;">
  <p style="margin:0;color:#94a3b8;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Elevate for Humanity</p>
  <p style="margin:4px 0 0;color:#64748b;font-size:11px;">DOL Sponsor &nbsp;|&nbsp; WorkOne Partner &nbsp;|&nbsp; Workforce Credential Institute</p>
</td></tr>
<tr><td style="padding:32px;"><div style="font-size:15px;line-height:1.7;">${paras}</div></td></tr>
<tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:12px;color:#64748b;">
    Elevate for Humanity &nbsp;|&nbsp; <a href="https://www.elevateforhumanity.org" style="color:#dc2626;">www.elevateforhumanity.org</a> &nbsp;|&nbsp;
    <a href="mailto:elevate4humanityedu@gmail.com" style="color:#dc2626;">elevate4humanityedu@gmail.com</a> &nbsp;|&nbsp; (317) 314-3537
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

const payload = JSON.stringify({
  personalizations: [{
    to: [{ email: 'info@hooverwood.org', name: 'Hooverwood Living Leadership Team' }],
    cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
  }],
  from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
  reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
  subject: 'Clinical Partnership Opportunity for CNA Training Program',
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
      console.log('✅ Delivered to info@hooverwood.org (CC: elevate4humanityedu@gmail.com)');
      console.log(`Timestamp: ${new Date().toISOString()}`);
    } else {
      console.log(`❌ Failed (${res.statusCode}): ${d}`);
    }
  });
});
req.on('error', console.error);
req.write(payload);
req.end();
