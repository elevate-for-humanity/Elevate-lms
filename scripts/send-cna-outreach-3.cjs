#!/usr/bin/env node
/**
 * CNA clinical partner outreach — batch 3 (Indianapolis facilities + home care agencies)
 * Usage: SENDGRID_API_KEY=SG.xxx node scripts/send-cna-outreach-3.cjs
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

// Clinical facility email body
function facilityBody(facilityName) {
  return `Hello,

My name is Elizabeth Greene and I am the Executive Director of Elevate for Humanity, a workforce development organization focused on building career pathways in healthcare, skilled trades, and technical fields.

We are launching a Certified Nurse Aide training pathway in partnership with an approved nurse aide training program and are currently seeking long-term care facilities in the Indianapolis area interested in hosting CNA clinical training for our students.

Our students complete their academic instruction online and then perform required hands-on clinical training under RN supervision at partner healthcare facilities. Facilities that partner with us receive priority access to trained graduates who are prepared to enter the workforce immediately upon completion.

Elevate for Humanity works with multiple national credentialing and workforce training organizations including Certiport, CareerSafe, JobReady, Milady, and ServSafe. Our goal is to create a reliable workforce pipeline that supports both student career development and the staffing needs of long-term care providers.

We would welcome the opportunity to speak with your Director of Nursing or Staff Development Coordinator about hosting clinical rotations and building a long-term workforce partnership with ${facilityName}.

Thank you for your time and consideration.

Elizabeth Greene
Executive Director
Elevate for Humanity
elevate4humanityedu@gmail.com
317-314-3537`;
}

// Home care agency email body
function agencyBody(agencyName) {
  return `Hello,

My name is Elizabeth Greene and I am the Executive Director of Elevate for Humanity, a workforce development organization focused on building career pathways in healthcare and other high-demand industries.

We are launching a Certified Nurse Aide training program in partnership with an approved nurse aide training provider and are reaching out to home care agencies in the Indianapolis area about potential workforce partnerships.

Our students complete structured online coursework followed by supervised hands-on clinical training under a licensed RN instructor. Upon completion, graduates hold their CNA credential and are ready to enter the workforce.

We believe ${agencyName} and Elevate for Humanity share a common goal: connecting trained, work-ready individuals with meaningful employment in home and community-based care. We would welcome the opportunity to discuss how our graduates could support your staffing needs.

Elevate for Humanity is also affiliated with multiple national workforce credential programs including Certiport, CareerSafe, JobReady, Milady, and ServSafe.

If you are open to a brief conversation, I would be happy to schedule a call at your convenience.

Thank you for your time and consideration.

Elizabeth Greene
Executive Director
Elevate for Humanity
elevate4humanityedu@gmail.com
317-314-3537`;
}

const FACILITIES = [
  { name: 'American Village',                  email: 'info@americanvillage.com' },
  { name: 'Robin Run Village',                 email: 'robinrun@americareusa.net' },
  { name: 'Hoosier Village Retirement Community', email: 'info@hoosiervillage.com' },
  { name: 'Allison Pointe Healthcare Center',  email: 'info@allisonpointehc.com' },
  { name: 'Spring Mill Meadows',               email: 'springmillmeadows@american-senior.com' },
  { name: 'Rosewalk Village at Indiana Masonic Home', email: 'info@rosewalkvillage.com' },
  { name: 'Greenwood Health and Living Community', email: 'info@greenwoodhealthliving.com' },
  { name: 'Forest Creek Village',              email: 'info@forestcreekvillage.com' },
  { name: 'Eagle Valley Meadows',              email: 'info@eaglevalleymeadows.com' },
  { name: 'Westside Village Health Center',    email: 'info@westsidevillagehc.com' },
];

const AGENCIES = [
  { name: 'Home Instead Indianapolis',         email: 'info.indy@homeinstead.com' },
  { name: 'Visiting Angels Indianapolis',      email: 'indy@visitingangels.com' },
  { name: 'Comfort Keepers Indianapolis',      email: 'indy@comfortkeepers.com' },
  { name: 'Senior Helpers Indianapolis',       email: 'indianapolis@seniorhelpers.com' },
  { name: 'Right at Home Indianapolis',        email: 'info@rahindy.net' },
];

const EMAILS = [
  ...FACILITIES.map(f => ({
    to: f.email,
    toName: 'Administration',
    subject: 'CNA Clinical Training Partnership — Elevate for Humanity',
    body: facilityBody(f.name),
  })),
  ...AGENCIES.map(a => ({
    to: a.email,
    toName: 'Administration',
    subject: 'CNA Workforce Partnership — Elevate for Humanity',
    body: agencyBody(a.name),
  })),
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
  console.log(`Sending ${EMAILS.length} emails (${FACILITIES.length} facilities + ${AGENCIES.length} agencies)...\n`);
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
