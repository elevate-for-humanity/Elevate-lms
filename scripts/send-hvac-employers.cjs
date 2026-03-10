#!/usr/bin/env node
/**
 * HVAC employer outreach — Indianapolis contractors that hire entry-level techs
 * Usage: SENDGRID_API_KEY=SG.xxx node scripts/send-hvac-employers.cjs
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

Elevate for Humanity operates a Workforce Credential Institute focused on preparing individuals for high-demand careers through structured training pathways and industry-recognized credentials.

Our organization works closely with workforce partners including WorkOne centers, Job Ready Indy, and workforce initiatives aligned with U.S. Department of Labor workforce programs.

In addition to workforce training, Elevate for Humanity operates a credential testing center and serves as a proctoring site for nationally recognized assessments including ACT WorkKeys and NRF RISE credentials. We also provide proctoring support for HVAC certifications, including EPA Section 608 testing.

As we expand our HVAC training pathways, we are seeking to build partnerships with HVAC contractors and apprenticeship programs to create a pipeline from training into employment opportunities.

Becoming an Employer Partner with Elevate for Humanity provides several advantages:

• Access to a pipeline of individuals preparing to enter HVAC careers
• Graduates who complete EPA Section 608, OSHA 10, and ACT WorkKeys before entering the workforce
• Reduced recruiting and hiring costs through direct workforce referrals
• Opportunities to connect with workforce development initiatives and funding sources
• Increased visibility as a community workforce partner
• Collaboration on workforce training and apprenticeship initiatives

Our goal is to prepare individuals through foundational HVAC training and workforce readiness and then connect them directly with employers seeking skilled technicians and apprentices.

We would welcome the opportunity to schedule a brief meeting to introduce our organization and explore potential collaboration opportunities.

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

// No public emails found for any of these — all require phone or contact form
const MANUAL = [
  { org: 'One Hour Heating & Air Conditioning', note: 'Call (317) 742-6699 | onehourheatandair.com' },
  { org: 'Peterman Brothers',                   note: 'Call (317) 859-4270 | 5240 Commerce Cir, Indianapolis | petermanhvac.com' },
  { org: 'Godby Heating Plumbing Electrical',   note: 'Call (317) 870-8400 | 7852 Moller Rd, Indianapolis | godbyhp.com' },
  { org: 'R.T. Moore Company',                  note: 'Call (317) 823-1500 | 6340 La Pas Trail, Indianapolis | rtmoore.com' },
  { org: 'Carrier Corporation',                 note: 'Contact form: carrier.com' },
  { org: 'Williams Comfort Air',                note: 'Call (317) 268-5900 | 23 S 8th Ave, Beech Grove | williamscomfortair.com' },
  { org: 'GEMCO Constructors',                  note: 'Call (317) 423-0200 | 11901 Exit 5 Pkwy, Fishers | gemcoconstructors.com' },
];

async function main() {
  console.log('No direct emails available for HVAC employer batch.\n');
  console.log('--- Manual Contact Required ---');
  MANUAL.forEach(m => console.log(`  ${m.org}: ${m.note}`));
  console.log('\nRecommendation: Call each company, ask for the Service Manager or HR Director,');
  console.log('and reference the email sent to MCA Indiana and Indiana HVAC Association.');
}

main();
