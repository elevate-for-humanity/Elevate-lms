#!/usr/bin/env node
/**
 * One-time CNA clinical partner outreach emails.
 * Usage: SENDGRID_API_KEY=SG.xxx node scripts/send-cna-outreach.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) {
  console.error('ERROR: SENDGRID_API_KEY not set.');
  console.error('Run: SENDGRID_API_KEY=SG.your_key node scripts/send-cna-outreach.js');
  process.exit(1);
}

const FROM = 'noreply@elevateforhumanity.org';
const REPLY_TO = 'elevate4humanityedu@gmail.com';

// Encode logo as base64 attachment
const logoPath = path.join(__dirname, '../public/images/Elevate_for_Humanity_logo_81bf0fab.jpg');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');

const LOGO_ATTACHMENT = {
  content: logoBase64,
  filename: 'Elevate_for_Humanity_logo.jpg',
  type: 'image/jpeg',
  disposition: 'inline',
  content_id: 'elevate_logo',
};

// Shared HTML wrapper with logo header
function buildHtml(bodyText) {
  // Convert plain text paragraphs to HTML
  const paragraphs = bodyText
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin: 0 0 16px 0; color: #1e293b;">${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:24px 32px;text-align:center;">
            <img src="cid:elevate_logo" alt="Elevate for Humanity" width="60" style="display:block;margin:0 auto 8px;">
            <p style="margin:0;color:#94a3b8;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Elevate for Humanity</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <div style="font-size:15px;line-height:1.7;">
              ${paragraphs}
            </div>
          </td>
        </tr>
        <!-- Footer -->
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

const COPY_TO = 'elevate4humanityedu@gmail.com';

const EMAILS = [
  {
    to: 'jmorrow@gvsnet.org',
    toName: 'Jordan Morrow',
    subject: 'CNA Clinical Training Partnership — Elevate for Humanity',
    body: `Dear Mr. Morrow,

My name is Elizabeth Greene and I serve as Executive Director of Elevate for Humanity. Our organization operates workforce training and credential programs designed to connect individuals with high-demand careers in healthcare and skilled trades.

Elevate for Humanity is currently launching a Certified Nurse Aide training pathway in partnership with an approved nurse aide training program. Our model combines online instruction with supervised hands-on clinical training at partner healthcare facilities. We are reaching out to explore a potential partnership with Greenwood Village South as a clinical training site for our students.

Through this collaboration, your facility would receive priority access to graduates who have completed structured training and are prepared to enter the workforce. Our goal is to create a reliable workforce pipeline that supports both student career development and the staffing needs of long-term care providers.

Elevate for Humanity also operates workforce credential programs and testing services affiliated with several national certification organizations, including Certiport, CareerSafe, JobReady, Milady, and ServSafe. Our broader mission is to expand access to industry-recognized credentials and employment pathways.

I would welcome the opportunity to speak with you or a member of your leadership team about hosting CNA clinical rotations and building a long-term workforce partnership.

Thank you for your time and consideration.

Elizabeth Greene
Executive Director, Elevate for Humanity
elevate4humanityedu@gmail.com
317-314-3537`,
  },
  {
    to: 'admin@bloomateaglecreek.com',
    toName: 'Administration',
    subject: 'CNA Clinical Training Partnership — Elevate for Humanity',
    body: `Hello,

My name is Elizabeth Greene and I am the Executive Director of Elevate for Humanity, a workforce development organization focused on training individuals for in-demand healthcare and technical careers.

We are launching a Certified Nurse Aide training program in partnership with an approved nurse aide training provider and are currently seeking healthcare facilities interested in serving as clinical training partners. Our students complete structured online coursework followed by supervised hands-on clinical training under RN oversight at partner facilities.

A partnership with Bloom at Eagle Creek would allow your organization to host CNA clinical rotations while gaining early access to qualified graduates entering the workforce. Our goal is to support long-term care providers by creating a consistent pipeline of trained and work-ready CNA candidates.

In addition to healthcare training pathways, Elevate for Humanity operates workforce credential programs affiliated with organizations such as Certiport, CareerSafe, JobReady, Milady, and ServSafe. We are focused on building partnerships that connect training directly to employment opportunities.

I would welcome the opportunity to discuss how we could collaborate to support both workforce development and your staffing needs.

Thank you for your time and consideration.

Elizabeth Greene
Executive Director, Elevate for Humanity
elevate4humanityedu@gmail.com
317-314-3537`,
  },
  {
    to: 'admin@bloomatwillow.com',
    toName: 'Administration',
    subject: 'CNA Clinical Training Partnership — Elevate for Humanity',
    body: `Hello,

My name is Elizabeth Greene, Executive Director of Elevate for Humanity. Our organization focuses on workforce training initiatives that connect individuals with employment opportunities in healthcare and other high-demand industries.

We are currently launching a Certified Nurse Aide training pathway in partnership with an approved nurse aide training provider and are seeking clinical partners in the Indianapolis area. Our program combines online classroom instruction with hands-on clinical training under the supervision of a licensed RN instructor.

We are reaching out to explore the possibility of partnering with Bloom at Willow to host CNA clinical rotations. Through this collaboration, your facility would have early access to trained graduates who are ready to enter the workforce and contribute to resident care.

Elevate for Humanity is also affiliated with multiple national workforce credential programs including Certiport, CareerSafe, JobReady, Milady, and ServSafe, allowing us to support individuals across multiple career pathways.

If your organization is open to discussing a potential partnership, I would be happy to schedule a brief call at your convenience.

Thank you for your time and for the important work your team does for the community.

Elizabeth Greene
Executive Director, Elevate for Humanity
elevate4humanityedu@gmail.com
317-314-3537`,
  },
];

function sendEmail(email) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      personalizations: [{ to: [{ email: email.to, name: email.toName }], cc: [{ email: COPY_TO, name: 'Elizabeth Greene' }] }],
      from: { email: FROM, name: 'Elizabeth Greene | Elevate for Humanity' },
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
    // 500ms gap between sends
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\n--- Report ---');
  const sent = results.filter((r) => r.status === 'sent');
  const failed = results.filter((r) => r.status !== 'sent');
  console.log(`Sent: ${sent.length}/${results.length}`);
  if (failed.length) {
    console.log('Failed:');
    failed.forEach((f) => console.log(`  ${f.to}: ${f.error}`));
  }
  console.log('\nDelivery timestamps:');
  sent.forEach((r) => console.log(`  ${r.to}  ${r.ts}`));
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
