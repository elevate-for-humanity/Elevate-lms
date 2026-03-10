#!/usr/bin/env node
/**
 * HVAC distributor outreach — Indianapolis region
 * Usage: SENDGRID_API_KEY=SG.xxx node scripts/send-hvac-distributors.cjs
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

Elevate for Humanity operates a Workforce Credential Institute focused on preparing individuals for careers in skilled trades through structured training pathways and industry-recognized credentials.

Our organization works with workforce partners including WorkOne centers, Job Ready Indy, and initiatives aligned with U.S. Department of Labor workforce programs. In addition to training programs, we operate a credential testing center and serve as a proctoring site for ACT WorkKeys, NRF RISE credentials, and HVAC certification exams including EPA Section 608.

As we expand our HVAC workforce training pathways, we are building partnerships with HVAC contractors and industry partners to strengthen the pipeline of qualified technicians entering the industry.

Because HVAC distributors play a critical role in supporting contractors and industry training, we would welcome the opportunity to connect and explore ways we can collaborate to support technician workforce development in the Indianapolis region.

Our goal is to help prepare individuals for careers in HVAC while connecting them directly with contractors and apprenticeship opportunities.

I would appreciate the opportunity to schedule a brief meeting to introduce our organization and discuss potential collaboration.

Thank you for your time and consideration.

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
  <p style="margin:4px 0 0;color:#64748b;font-size:11px;">DOL Sponsor &nbsp;|&nbsp; WorkOne Partner &nbsp;|&nbsp; EPA 608 Proctoring &nbsp;|&nbsp; ACT WorkKeys Site</p>
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

// No public general emails for these distributors — all route through contact forms or branch phones
const MANUAL = [
  { org: 'Johnstone Supply Indianapolis',  note: 'Call (317) 926-5186 | 1050 E 30th St, Indianapolis | johnstonesupply.com — ask for Branch Manager' },
  { org: 'Ferguson Indianapolis',          note: 'Call (317) 334-1700 | 8230 Zionsville Rd, Indianapolis | ferguson.com — ask for Branch Manager' },
  { org: 'R.E. Michel Company',            note: 'Call (317) 293-8060 | 6641 Guion Rd, Indianapolis | remichel.com — ask for Branch Manager' },
  { org: 'United Refrigeration',           note: 'Call (317) 872-9233 | 5150 W 84th St, Indianapolis | uri.com — ask for Branch Manager' },
  { org: 'Gemaire Distributors',           note: 'Call (317) 291-3535 | 4020 Industrial Blvd, Indianapolis | gemaire.com — ask for Branch Manager' },
];

async function main() {
  console.log('HVAC Distributor Outreach — Indianapolis\n');
  console.log('None of these distributors publish general contact emails.');
  console.log('Direct branch calls are the fastest path.\n');
  console.log('--- Call List ---');
  MANUAL.forEach(m => console.log(`  ${m.org}:\n    ${m.note}\n`));
  console.log('Script: "Hi, my name is Elizabeth Greene, Executive Director of Elevate for Humanity.');
  console.log('We run HVAC workforce training and EPA 608 proctoring in Indianapolis.');
  console.log('I wanted to reach out about collaborating to support technician training');
  console.log('for contractors in your network. Could I speak with your branch manager?"');
}

main();
