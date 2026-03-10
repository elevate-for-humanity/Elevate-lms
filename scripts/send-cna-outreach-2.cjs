#!/usr/bin/env node
/**
 * CNA clinical partner outreach — batch 2
 * Usage: SENDGRID_API_KEY=SG.xxx node scripts/send-cna-outreach-2.cjs
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
    to: 'jmorrow@gvsnet.org',
    toName: 'Jordan Morrow',
    subject: 'CNA Clinical Training Partnership — Elevate for Humanity',
    body: `Dear Mr. Morrow,

My name is Elizabeth Greene and I am the Executive Director of Elevate for Humanity, a workforce development organization focused on building career pathways in healthcare, skilled trades, and technical fields.

We are launching a Certified Nurse Aide training pathway in partnership with an approved nurse aide training program and are currently seeking long-term care partners interested in hosting CNA clinical training for our students.

Elevate for Humanity works with multiple national credentialing and workforce training organizations including Certiport, CareerSafe, JobReady, Milady, and ServSafe. Our mission is to provide industry-recognized credentials and connect individuals with meaningful employment opportunities.

Our CNA students complete their academic instruction online and then perform required hands-on clinical training under RN supervision at partner healthcare facilities. Through this partnership, Greenwood Village South would receive priority access to trained graduates ready for employment.

We would welcome the opportunity to discuss hosting clinical rotations and building a long-term workforce partnership with your facility.

Thank you for your time and consideration.

Elizabeth Greene
Executive Director
Elevate for Humanity
elevate4humanityedu@gmail.com
317-314-3537`,
  },
  {
    to: 'aulrey@gvsnet.org',
    toName: 'Alexa Ulrey',
    subject: 'CNA Clinical Training Partnership — Elevate for Humanity',
    body: `Dear Ms. Ulrey,

My name is Elizabeth Greene and I serve as Executive Director of Elevate for Humanity, a workforce training organization dedicated to expanding career pathways in healthcare and other high-demand industries.

We are currently launching a Certified Nurse Aide training cohort in partnership with an approved nurse aide training program and are seeking clinical training partners in the Indianapolis area.

Our students complete their classroom instruction online and then perform supervised hands-on clinical training under RN oversight at a partner healthcare facility. We are reaching out to explore the possibility of partnering with Greenwood Village South for CNA clinical rotations.

Facilities that partner with us receive priority access to graduates who have completed structured training and are prepared to enter the workforce.

I would welcome the opportunity to speak with you about whether your facility may be open to serving as a clinical training site for our students.

Thank you for the work your team does in caring for residents and supporting the healthcare workforce.

Elizabeth Greene
Executive Director
Elevate for Humanity
elevate4humanityedu@gmail.com
317-314-3537`,
  },
  {
    to: 'admin@bloomateaglecreek.com',
    toName: 'Administration',
    subject: 'CNA Clinical Training Partnership — Elevate for Humanity',
    body: `Hello,

My name is Elizabeth Greene and I am the Executive Director of Elevate for Humanity. Our organization develops workforce training pathways that prepare individuals for employment in healthcare and other essential industries.

We are currently launching a Certified Nurse Aide training program in partnership with an approved nurse aide training provider and are seeking healthcare facilities interested in partnering with us as clinical training sites.

Our students complete online coursework and then perform hands-on clinical training under the supervision of a licensed RN instructor at a partner facility.

This partnership allows facilities to host CNA clinical rotations while also gaining early access to trained graduates entering the workforce.

Elevate for Humanity is also affiliated with multiple national workforce credential programs including Certiport, CareerSafe, JobReady, Milady, and ServSafe.

If your team would be open to discussing a potential collaboration, I would welcome the opportunity to schedule a brief call.

Thank you for your time and consideration.

Elizabeth Greene
Executive Director
Elevate for Humanity
elevate4humanityedu@gmail.com
317-314-3537`,
  },
  {
    to: 'SuWilliams@health.in.gov',
    toName: 'Suzanne Williams',
    subject: 'CNA Clinical Training — Guidance Request | Elevate for Humanity',
    body: `Dear Ms. Williams,

My name is Elizabeth Greene and I am the Executive Director of Elevate for Humanity, a workforce development organization focused on providing industry-recognized credentials and employment pathways.

We are preparing to launch a Certified Nurse Aide training pathway in partnership with an approved nurse aide training program and are currently identifying clinical training partners in the Indianapolis area.

I wanted to reach out to ensure we are aligning with Indiana Department of Health guidelines regarding CNA clinical training partnerships and facility participation.

If there are any recommended resources or guidance your office can provide regarding clinical placement partnerships for nurse aide training programs, we would greatly appreciate your direction.

Thank you for your time and for the work your office does to support healthcare training programs across Indiana.

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
        cc: [{ email: COPY_TO, name: 'Elizabeth Greene' }],
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
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode === 202) {
            resolve({ ok: true, status: res.statusCode });
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
  console.log(`Sending ${EMAILS.length} outreach emails...\n`);
  const results = [];

  for (const email of EMAILS) {
    process.stdout.write(`  → ${email.to} ... `);
    try {
      const result = await sendEmail(email);
      if (result.ok) {
        console.log('✅ delivered (202)');
        results.push({ to: email.to, status: 'sent', ts: new Date().toISOString() });
      } else {
        console.log(`❌ failed (${result.status}): ${result.body}`);
        results.push({ to: email.to, status: 'failed', error: result.body });
      }
    } catch (err) {
      console.log(`❌ error: ${err.message}`);
      results.push({ to: email.to, status: 'error', error: err.message });
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\n--- Delivery Report ---');
  const sent = results.filter((r) => r.status === 'sent');
  const failed = results.filter((r) => r.status !== 'sent');
  console.log(`Sent: ${sent.length}/${results.length}`);
  if (failed.length) {
    console.log('Failed:');
    failed.forEach((f) => console.log(`  ${f.to}: ${f.error}`));
  }
  console.log('\nTimestamps:');
  sent.forEach((r) => console.log(`  ${r.to}  ${r.ts}`));
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
