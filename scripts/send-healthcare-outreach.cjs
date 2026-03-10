#!/usr/bin/env node
/**
 * Phlebotomy & Medical Assistant employer outreach — Indianapolis healthcare systems
 * Usage: SENDGRID_API_KEY=SG.xxx node scripts/send-healthcare-outreach.cjs
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

Elevate for Humanity operates a Workforce Credential Institute focused on preparing individuals for high-demand healthcare careers through structured training pathways and industry-recognized credentials.

Our organization works with workforce partners including WorkOne centers, Job Ready Indy, and initiatives aligned with U.S. Department of Labor workforce programs.

In addition to workforce training, Elevate for Humanity operates a credential testing center and serves as a proctoring site for nationally recognized assessments including ACT WorkKeys and NRF RISE credentials.

As we expand our healthcare training programs, including Medical Assistant and Phlebotomy pathways, we are seeking to build partnerships with healthcare providers, laboratories, and clinics to create a clear pathway from training into employment opportunities.

Becoming an Employer Partner with Elevate for Humanity provides several advantages:

• Access to a pipeline of individuals preparing for healthcare support careers
• Reduced recruiting and hiring costs through direct workforce referrals
• Opportunities to connect with workforce development initiatives and funding sources
• Increased visibility as a community workforce partner
• Collaboration on workforce training and clinical placement initiatives

Our goal is to prepare individuals through foundational healthcare training and then connect them directly with employers seeking skilled support staff in medical offices, clinics, and laboratory settings.

We would welcome the opportunity to schedule a brief meeting to introduce our organization and explore potential collaboration opportunities.

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

// All major systems route workforce/partnership inquiries through HR portals or contact forms
// No direct general emails published for IU Health, Community Health, Ascension, Labcorp, Quest, AHN
const MANUAL = [
  { org: 'Indiana University Health',      note: 'Call (317) 962-2000 | iuhealth.org — ask for Workforce Development or HR Partnerships' },
  { org: 'Community Health Network',       note: 'Call (317) 621-6262 | ecommunity.com — ask for HR or Workforce Development' },
  { org: 'Ascension St. Vincent',          note: 'Call (317) 338-2345 | healthcare.ascension.org — ask for HR or Education Partnerships' },
  { org: 'Labcorp',                        note: 'Call (800) 845-6167 | labcorp.com — ask for Regional Recruiting or Workforce Partnerships' },
  { org: 'Quest Diagnostics',              note: 'Call (866) 697-8378 | questdiagnostics.com — ask for Regional HR or Training Partnerships' },
  { org: 'American Health Network',        note: 'Contact form: ahni.com — ask for HR or Practice Operations' },
];

async function main() {
  console.log('Phlebotomy & Medical Assistant Employer Outreach\n');
  console.log('All major healthcare systems route partnership inquiries through HR portals.');
  console.log('Direct calls to HR or Workforce Development are the fastest path.\n');
  console.log('--- Call List ---');
  MANUAL.forEach(m => console.log(`  ${m.org}:\n    ${m.note}\n`));
  console.log('Call script:');
  console.log('"Hi, this is Elizabeth Greene, Executive Director of Elevate for Humanity.');
  console.log('We run Medical Assistant and Phlebotomy training programs in Indianapolis');
  console.log('and are building employer partnerships for graduate placement.');
  console.log('Could I speak with someone in Workforce Development or HR Partnerships?"');
}

main();
