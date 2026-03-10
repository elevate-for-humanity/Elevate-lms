#!/usr/bin/env node
/**
 * Construction apprenticeship & employer partner outreach
 * Usage: SENDGRID_API_KEY=SG.xxx node scripts/send-construction-outreach.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1); }

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg')
).toString('base64');

const LOGO_ATTACHMENT = {
  content: logoBase64,
  filename: 'Elevate_for_Humanity_logo.jpg',
  type: 'image/jpeg',
  disposition: 'inline',
  content_id: 'elevate_logo',
};

function emailBody(orgName) {
  return `Dear ${orgName} Team,

My name is Elizabeth Greene, and I serve as Executive Director of Elevate for Humanity, a workforce development and credential training organization based in Indianapolis.

Elevate for Humanity operates a Workforce Credential Institute that prepares individuals for high-demand careers through structured training pathways and industry-recognized credentials. Our organization works closely with workforce partners including WorkOne centers, workforce development initiatives aligned with the U.S. Department of Labor, and Job Ready Indy to help connect individuals to sustainable employment opportunities.

In addition to workforce training, Elevate for Humanity also operates a credential testing and proctoring center. We are an approved proctoring site for several nationally recognized assessments including ACT WorkKeys and NRF RISE credentials. We also provide proctoring support for HVAC industry certifications and workforce credential exams.

As we expand our Skilled Trades and Construction pathways, we are building partnerships with apprenticeship programs and construction employers to create a clear pipeline from training into employment. Our goal is to prepare individuals through foundational training and workforce readiness and then connect them directly with employers and apprenticeship sponsors.

Through an Employer Partnership with Elevate for Humanity, organizations benefit from:

• Access to a pipeline of motivated candidates preparing to enter the construction trades
• Reduced recruitment and hiring costs through direct workforce referrals
• Opportunities to connect with workforce development initiatives and funding sources
• Increased visibility as a community workforce partner supporting career pathways
• Collaboration on apprenticeship and skilled trades workforce development

We are currently working to build employer partnerships with organizations in the construction industry, including contractors such as Harry Construction, and apprenticeship training programs that are interested in strengthening their workforce pipeline.

I would welcome the opportunity to schedule a brief meeting to introduce our organization, learn more about your apprenticeship programs, and explore how we can collaborate to support construction workforce development in Indiana.

Thank you for your time and consideration. I look forward to connecting.

Sincerely,
Elizabeth Greene
Executive Director
Elevate for Humanity | Workforce Credential Institute
www.elevateforhumanity.org
elevate4humanityedu@gmail.com
317-314-3537`;
}

function buildHtml(text) {
  const paras = text.split('\n\n').filter(p => p.trim())
    .map(p => `<p style="margin:0 0 16px 0;color:#1e293b;">${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#1e293b;padding:24px 32px;text-align:center;">
  <img src="cid:elevate_logo" alt="Elevate for Humanity" width="60" style="display:block;margin:0 auto 8px;">
  <p style="margin:0;color:#ffffff;font-size:14px;font-weight:700;">Elevate for Humanity</p>
  <p style="margin:4px 0 0;color:#64748b;font-size:11px;">DOL Sponsor &nbsp;|&nbsp; WorkOne Partner &nbsp;|&nbsp; Job Ready Indy &nbsp;|&nbsp; Workforce Credential Institute</p>
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

const RECIPIENTS = [
  {
    org: 'Indiana Plan',
    to: 'info@indianaplan.org',
    toName: 'Indiana Plan Team',
  },
  {
    org: 'Associated Builders and Contractors Indiana Kentucky Chapter',
    to: 'info@abcindianakentucky.org',
    toName: 'ABC Indiana Kentucky Team',
  },
  {
    org: 'Central Midwest Regional Council of Carpenters',
    to: 'website@cmwcarpenters.com',
    toName: 'CMRCC Team',
  },
];

function sendEmail(recipient) {
  const body = emailBody(recipient.org);
  const payload = JSON.stringify({
    personalizations: [{
      to: [{ email: recipient.to, name: recipient.toName }],
      cc: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' }],
    }],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
    reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
    subject: 'Workforce Partnership Opportunity — Elevate for Humanity',
    content: [
      { type: 'text/plain', value: body },
      { type: 'text/html', value: buildHtml(body) },
    ],
    attachments: [LOGO_ATTACHMENT],
  });

  return new Promise((resolve, reject) => {
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
      res.on('end', () => res.statusCode === 202
        ? resolve({ ok: true })
        : resolve({ ok: false, status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Sending ${RECIPIENTS.length} construction outreach emails...\n`);
  const results = [];

  for (const r of RECIPIENTS) {
    process.stdout.write(`  → ${r.to} (${r.org}) ... `);
    try {
      const result = await sendEmail(r);
      if (result.ok) {
        console.log('✅ delivered');
        results.push({ to: r.to, org: r.org, status: 'sent', ts: new Date().toISOString() });
      } else {
        console.log(`❌ failed (${result.status}): ${result.body}`);
        results.push({ to: r.to, org: r.org, status: 'failed', error: result.body });
      }
    } catch (err) {
      console.log(`❌ error: ${err.message}`);
      results.push({ to: r.to, org: r.org, status: 'error', error: err.message });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n--- Delivery Report ---');
  const sent = results.filter(r => r.status === 'sent');
  const failed = results.filter(r => r.status !== 'sent');
  console.log(`Sent: ${sent.length}/${results.length}`);
  if (failed.length) {
    console.log('Failed:');
    failed.forEach(f => console.log(`  ${f.to}: ${f.error}`));
  }
  console.log('\nTimestamps:');
  sent.forEach(r => console.log(`  ${r.org} | ${r.to} | ${r.ts}`));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
