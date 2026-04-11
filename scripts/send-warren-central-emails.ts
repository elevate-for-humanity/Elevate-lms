/**
 * Sends partnership outreach and Letter of Recognition to Warren Central High School.
 *
 * Recipients:
 *   - Masimba Taylor, Principal — mtaylor4@warren.k12.in.us
 *   - Nicole Simpson, Intervention Specialist — nsimpson@warren.k12.in.us
 *
 * Usage: pnpm tsx scripts/send-warren-central-emails.ts
 */

import fs from 'fs';
import path from 'path';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = 'noreply@elevateforhumanity.org';
const FROM_NAME = 'Elizabeth Greene — Elevate for Humanity';
const REPLY_TO = 'elevate4humanityedu@gmail.com';

const PRINCIPAL_EMAIL = 'mtaylor4@warren.k12.in.us';
const INTERVENTION_EMAIL = 'nsimpson@warren.k12.in.us';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY is not set');
  process.exit(1);
}

const LETTER_PDF = path.join(
  process.cwd(),
  'docs/grants/employindy-2026-003-pdfs/08-letter-of-recognition-warren-central.pdf'
);

const MOU_PDF = path.join(
  process.cwd(),
  'docs/grants/employindy-2026-003-pdfs/06-mou-warren-central.pdf'
);

async function sendEmail(payload: object): Promise<boolean> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  ❌ SendGrid error: ${error}`);
    return false;
  }
  return true;
}

function loadPdfBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString('base64');
}

const HEADER = `
<div style="font-family:Arial,sans-serif;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:20px;">
  <div style="font-size:15px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#111;">Elevate for Humanity</div>
  <div style="font-size:10px;color:#444;margin-top:3px;">DOL Registered Apprenticeship Sponsor &nbsp;·&nbsp; ETPL Provider &nbsp;·&nbsp; WIOA / WRG / JRI Approved &nbsp;·&nbsp; EmployIndy Partner &nbsp;·&nbsp; WorkOne Partner</div>
  <div style="font-size:10px;color:#444;margin-top:1px;">SAM.gov CAGE: 0Q856 &nbsp;·&nbsp; IMM Certified &nbsp;·&nbsp; ByBlack Certified &nbsp;·&nbsp; www.elevateforhumanity.org</div>
</div>`;

const SIGNATURE = `
<div style="margin-top:28px;border-top:1px solid #ccc;padding-top:14px;font-family:Arial,sans-serif;font-size:11px;color:#333;">
  <strong>Elizabeth Greene</strong><br>
  Founder &amp; Chief Executive Officer<br>
  Elevate for Humanity<br>
  <a href="https://www.elevateforhumanity.org" style="color:#111;">www.elevateforhumanity.org</a><br>
  elevate4humanityedu@gmail.com<br>
  Indianapolis, Indiana<br><br>
  <span style="color:#666;">U.S. Army Veteran &nbsp;·&nbsp; IRS Enrolled Agent &nbsp;·&nbsp; EPA 608 Certified Proctor &nbsp;·&nbsp; DOL RAP Provider ID 206251 &nbsp;·&nbsp; CAGE: 0Q856</span>
</div>`;

async function main() {
  console.log('\n📧 Sending emails to Warren Central High School\n');

  const letterBase64 = loadPdfBase64(LETTER_PDF);
  const mouBase64 = loadPdfBase64(MOU_PDF);

  // ── Email 1: Partnership outreach to Principal Taylor + CC Nicole Simpson ──
  process.stdout.write('  [1/2] Sending partnership outreach to Principal Taylor + Nicole Simpson ... ');

  const outreachHtml = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;font-size:12px;color:#111;max-width:680px;margin:0 auto;padding:32px 24px;line-height:1.7;">
${HEADER}
<p>April [DATE], 2026</p>
<p>
  <strong>Masimba Taylor</strong>, Principal<br>
  <strong>Nicole Simpson</strong>, Intervention Specialist<br>
  Warren Central High School — MSD Warren Township<br>
  Indianapolis, Indiana
</p>
<p>Dear Principal Taylor and Ms. Simpson,</p>
<p>
  My name is Elizabeth Greene. I am the Founder and Chief Executive Officer of <strong>Elevate for Humanity</strong>,
  a Marion County nonprofit workforce development organization and existing EmployIndy and WorkOne partner.
</p>
<p>
  I am writing to invite Warren Central High School to partner with Elevate for Humanity in our proposal for
  <strong>EmployIndy RFP 2026-003 — WIOA In-School Youth Service Provision</strong>. If awarded, this contract
  would bring a dedicated Career Coach directly into Warren Central to serve WIOA-eligible students ages 16–19
  with documented barriers — at <strong>no cost to the school or its students</strong>.
</p>
<p><strong>What Elevate would provide to Warren Central students:</strong></p>
<ul style="padding-left:20px;">
  <li>Dedicated Career Coach (Ameco Martin) embedded at Warren Central during school hours</li>
  <li>WIOA enrollment and Individual Service Strategy development for every participant</li>
  <li>HVAC pre-apprenticeship pathway leading to <strong>EPA 608 Universal Certification</strong> — a federally recognized, industry-required credential</li>
  <li>All 14 WIOA Youth Service Elements: career exploration, financial literacy, leadership development, work-based learning, and postsecondary transition support</li>
  <li>Transportation stipends, work attire, and exam fees covered — no cost to students</li>
  <li>12-month follow-up services for all program completers</li>
</ul>
<p>
  The proposal deadline is <strong>April 24, 2026</strong>. I have attached a formal Letter of Recognition and
  a draft MOU for your review. I would welcome a brief 30-minute call this week to discuss.
</p>
<p><strong>Proposed meeting times:</strong></p>
<ul style="padding-left:20px;">
  <li>Monday, April 7 — 10:00AM or 2:00PM</li>
  <li>Tuesday, April 8 — 11:00AM or 3:00PM</li>
  <li>Wednesday, April 9 — 10:00AM or 1:00PM</li>
</ul>
<p>
  You can also learn more about our work at
  <a href="https://www.elevateforhumanity.org" style="color:#111;">www.elevateforhumanity.org</a>.
</p>
<p>Thank you for your time and for your commitment to Warren Central students.</p>
${SIGNATURE}
</body></html>`;

  const outreachSuccess = await sendEmail({
    personalizations: [{
      to: [{ email: PRINCIPAL_EMAIL, name: 'Masimba Taylor' }],
      cc: [{ email: INTERVENTION_EMAIL, name: 'Nicole Simpson' }],
    }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    reply_to: { email: REPLY_TO, name: 'Elizabeth Greene' },
    subject: 'Partnership Opportunity — WIOA Career Coaching at Warren Central | Elevate for Humanity',
    content: [{ type: 'text/html', value: outreachHtml }],
    attachments: [
      {
        content: letterBase64,
        filename: 'Elevate-for-Humanity-Letter-of-Recognition-Warren-Central.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
      {
        content: mouBase64,
        filename: 'Elevate-for-Humanity-MOU-Warren-Central-High-School.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });

  console.log(outreachSuccess ? '✅ sent' : '❌ failed');
  await new Promise((r) => setTimeout(r, 600));

  // ── Email 2: Direct note to Nicole Simpson ──
  process.stdout.write('  [2/2] Sending direct note to Nicole Simpson ... ');

  const simpsonHtml = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;font-size:12px;color:#111;max-width:680px;margin:0 auto;padding:32px 24px;line-height:1.7;">
${HEADER}
<p>April [DATE], 2026</p>
<p>
  <strong>Nicole Simpson</strong>, Intervention Specialist<br>
  Dean's Office — Warren Central High School<br>
  Indianapolis, Indiana
</p>
<p>Dear Ms. Simpson,</p>
<p>
  I am reaching out directly because your role as Intervention Specialist is central to the partnership
  we are proposing between <strong>Elevate for Humanity</strong> and Warren Central High School.
</p>
<p>
  Elevate for Humanity is applying for the <strong>EmployIndy WIOA In-School Youth Service Provision contract
  (RFP 2026-003)</strong>. If awarded, our Career Coach Ameco Martin would be embedded at Warren Central to
  serve WIOA-eligible students ages 16–19 with documented barriers — students you likely already know and work with.
</p>
<p>
  We would coordinate directly with you to identify eligible students, develop Individual Service Strategies,
  and ensure participants receive both school-based support and workforce services simultaneously. Your clinical
  expertise and student relationships are exactly what makes this partnership meaningful rather than transactional.
</p>
<p>
  I have copied Principal Taylor on our main outreach email and attached our Letter of Recognition and draft MOU.
  I would welcome a brief call at your convenience — even 15 minutes — to hear your perspective on which students
  this program could serve best.
</p>
<p>Thank you for everything you do for Warren Central students.</p>
${SIGNATURE}
</body></html>`;

  const simpsonSuccess = await sendEmail({
    personalizations: [{
      to: [{ email: INTERVENTION_EMAIL, name: 'Nicole Simpson' }],
    }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    reply_to: { email: REPLY_TO, name: 'Elizabeth Greene' },
    subject: 'WIOA Career Coaching Partnership — Warren Central | Elevate for Humanity',
    content: [{ type: 'text/html', value: simpsonHtml }],
    attachments: [
      {
        content: letterBase64,
        filename: 'Elevate-for-Humanity-Letter-of-Recognition-Warren-Central.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });

  console.log(simpsonSuccess ? '✅ sent' : '❌ failed');

  const total = [outreachSuccess, simpsonSuccess].filter(Boolean).length;
  console.log(`\n─────────────────────────────────`);
  console.log(`✅ Sent:   ${total}`);
  console.log(`❌ Failed: ${2 - total}`);
  console.log(`─────────────────────────────────\n`);

  if (total < 2) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
