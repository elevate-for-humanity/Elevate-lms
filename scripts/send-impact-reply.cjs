#!/usr/bin/env node
/**
 * Reply to Lesley Brown (IMPACT/FSSA) + meeting invite to Joe and Jessica
 * Usage: SENDGRID_API_KEY=SG.xxx node scripts/send-impact-reply.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) {
  console.error('ERROR: SENDGRID_API_KEY not set.');
  process.exit(1);
}

const FROM = 'noreply@elevateforhumanity.org';
const FROM_NAME = 'Elizabeth Greene | Elevate for Humanity';
const REPLY_TO = 'elevate4humanityedu@gmail.com';
const COPY_TO = 'elevate4humanityedu@gmail.com';

const logoPath = path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');

const LOGO_ATTACHMENT = {
  content: logoBase64,
  filename: 'Elevate_for_Humanity_logo.jpg',
  type: 'image/jpeg',
  disposition: 'inline',
  content_id: 'elevate_logo',
};

function buildHtml(bodyText) {
  const paragraphs = bodyText
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin:0 0 16px 0;color:#1e293b;">${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:#1e293b;padding:24px 32px;text-align:center;">
            <img src="cid:elevate_logo" alt="Elevate for Humanity" width="60" style="display:block;margin:0 auto 8px;">
            <p style="margin:0;color:#94a3b8;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Elevate for Humanity</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <div style="font-size:15px;line-height:1.7;">
              ${paragraphs}
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#64748b;">
              Elevate for Humanity &nbsp;|&nbsp;
              <a href="mailto:elevate4humanityedu@gmail.com" style="color:#dc2626;">elevate4humanityedu@gmail.com</a> &nbsp;|&nbsp;
              317-314-3537
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const EMAILS = [
  {
    // Reply to Lesley, CC Joe + Jessica + Elizabeth
    to: 'Lesley.Brown@koehlerpartners.com',
    toName: 'Lesley Brown',
    cc: [
      { email: 'william.gilles@fssa.in.gov', name: 'Joe Gilles' },
      { email: 'jessica.burton@fssa.in.gov', name: 'Jessica Burton' },
      { email: COPY_TO, name: 'Elizabeth Greene' },
    ],
    subject: 'Re: Partnering to Support Career Pathways with IMPACT: FSSA\'s No Cost Job Resource',
    body: `Dear Lesley,

Thank you so much for following up and for passing along my information to Jessica. I truly appreciate your responsiveness and your support in making this connection.

I completely understand that the IMPACT team manages full caseloads and I am happy to work within their timeline. I am reaching out to Joe and Jessica directly as well to introduce myself and express our readiness to move forward.

Elevate for Humanity is fully prepared to partner with IMPACT and we are excited about the opportunity to connect our participants with this resource. I would love to schedule a brief Zoom call this week at whatever time works best for everyone to discuss next steps and how we can best collaborate.

Please do not hesitate to reach out if there is anything else you need from our end in the meantime.

Thank you again, Lesley. I hope you have a wonderful week as well.

Elizabeth Greene
Executive Director
Elevate for Humanity
elevate4humanityedu@gmail.com
317-314-3537`,
  },
  {
    // Direct email to Joe and Jessica about setting up the meeting
    to: 'william.gilles@fssa.in.gov',
    toName: 'Joe Gilles',
    cc: [
      { email: 'jessica.burton@fssa.in.gov', name: 'Jessica Burton' },
      { email: 'Lesley.Brown@koehlerpartners.com', name: 'Lesley Brown' },
      { email: COPY_TO, name: 'Elizabeth Greene' },
    ],
    subject: 'Partnership Meeting Request — Elevate for Humanity & IMPACT',
    body: `Dear Joe and Jessica,

My name is Elizabeth Greene and I am the Executive Director of Elevate for Humanity, a workforce development organization based in Indianapolis. Lesley Brown with Koehler Partners has been kind enough to connect us and pass along your contact information.

I am reaching out because we are very interested in partnering with IMPACT to support our participants in accessing the no-cost job resources and career services your program provides. Elevate for Humanity serves individuals pursuing careers in healthcare, skilled trades, technology, and other high-demand fields, and we believe IMPACT is a strong complement to the training and credential pathways we offer.

We are ready to move forward and would love to schedule a brief Zoom call this week to introduce ourselves, learn more about how the partnership works, and discuss how we can begin referring participants.

Please let me know what day and time works best for you both and I will send a calendar invite right away. I am available any day this week and happy to work around your schedules.

Thank you for the important work you do and I look forward to connecting soon.

Elizabeth Greene
Executive Director
Elevate for Humanity
elevate4humanityedu@gmail.com
317-314-3537`,
  },
];

function sendEmail(email) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      personalizations: [{
        to: [{ email: email.to, name: email.toName }],
        cc: email.cc,
      }],
      from: { email: FROM, name: FROM_NAME },
      reply_to: { email: REPLY_TO, name: 'Elizabeth Greene' },
      subject: email.subject,
      content: [
        { type: 'text/plain', value: email.body },
        { type: 'text/html', value: buildHtml(email.body) },
      ],
      attachments: [LOGO_ATTACHMENT],
    });

    const req = https.request(
      {
        hostname: 'api.sendgrid.com',
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          if (res.statusCode === 202) {
            resolve({ ok: true });
          } else {
            resolve({ ok: false, status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Sending ${EMAILS.length} emails...\n`);
  const results = [];

  for (const email of EMAILS) {
    process.stdout.write(`  → ${email.to} ... `);
    try {
      const result = await sendEmail(email);
      if (result.ok) {
        console.log('✅ delivered');
        results.push({ to: email.to, status: 'sent', ts: new Date().toISOString() });
      } else {
        console.log(`❌ failed (${result.status}): ${result.body}`);
        results.push({ to: email.to, status: 'failed', error: result.body });
      }
    } catch (err) {
      console.log(`❌ error: ${err.message}`);
      results.push({ to: email.to, status: 'error', error: err.message });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n--- Delivery Report ---');
  const sent = results.filter(r => r.status === 'sent');
  const failed = results.filter(r => r.status !== 'sent');
  console.log(`Sent: ${sent.length}/${results.length}`);
  if (failed.length) {
    console.log('\nFailed:');
    failed.forEach(f => console.log(`  ${f.to}: ${f.error}`));
  }
  console.log('\nTimestamps:');
  sent.forEach(r => console.log(`  ${r.to}  ${r.ts}`));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
