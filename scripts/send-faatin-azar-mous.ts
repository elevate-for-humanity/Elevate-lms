#!/usr/bin/env tsx
/**
 * Sends employer MOU packets to the Faatin Azar employer partner network.
 *
 * Each recipient receives:
 *   - A cover email explaining the MOU and next steps
 *   - A link to the online MOU signing page (or a PDF attachment if --attach-pdf is passed)
 *
 * Usage:
 *   pnpm tsx scripts/send-faatin-azar-mous.ts
 *   pnpm tsx scripts/send-faatin-azar-mous.ts --dry-run
 *   pnpm tsx scripts/send-faatin-azar-mous.ts --attach-pdf
 *
 * Required env vars:
 *   SENDGRID_API_KEY
 *   NEXT_PUBLIC_SITE_URL (defaults to https://www.elevateforhumanity.org)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const API_KEY = process.env.SENDGRID_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
const DRY_RUN = process.argv.includes('--dry-run');
const ATTACH_PDF = process.argv.includes('--attach-pdf');

if (!API_KEY && !DRY_RUN) {
  console.error('❌ SENDGRID_API_KEY is not set. Use --dry-run to preview without sending.');
  process.exit(1);
}

// ── Recipients ────────────────────────────────────────────────────────────────
// Faatin Azar employer partner network — update with real contacts before sending.
const RECIPIENTS = [
  {
    contact: 'Team',
    email: 'guidingangels.care@gmail.com',
    company: 'Guiding Angels Care',
    industry: 'Healthcare',
    programs: ['CNA / Healthcare', 'Peer Recovery Specialist'],
  },
  {
    contact: 'Team',
    email: 'harmonyheights.care@gmail.com',
    company: 'Harmony Heights Care',
    industry: 'Healthcare',
    programs: ['CNA / Healthcare', 'Peer Recovery Specialist'],
  },
  {
    contact: 'Team',
    email: 'cradletocrayonsacademy@gmail.com',
    company: 'Cradle to Crayons Academy',
    industry: 'Education / Childcare',
    programs: ['CNA / Healthcare', 'Peer Recovery Specialist', 'IT Help Desk'],
  },
  // Additional employer partners — add real emails before sending
  // {
  //   contact: 'Team',
  //   email: '',
  //   company: 'Eskenazi Health',
  //   industry: 'Healthcare',
  //   programs: ['CNA / Healthcare'],
  // },
  // {
  //   contact: 'Team',
  //   email: '',
  //   company: 'IU Health',
  //   industry: 'Healthcare',
  //   programs: ['CNA / Healthcare'],
  // },
  // {
  //   contact: 'Team',
  //   email: '',
  //   company: 'American Senior Communities',
  //   industry: 'Long-Term Care',
  //   programs: ['CNA / Healthcare'],
  // },
  // {
  //   contact: 'Team',
  //   email: '',
  //   company: 'Trilogy Health Services',
  //   industry: 'Senior Living',
  //   programs: ['CNA / Healthcare'],
  // },
  // {
  //   contact: 'Team',
  //   email: '',
  //   company: 'Gaylor Electric',
  //   industry: 'Electrical',
  //   programs: ['Electrical Apprenticeship', 'HVAC Technician'],
  // },
  // {
  //   contact: 'Team',
  //   email: '',
  //   company: 'Ruan Transportation',
  //   industry: 'Transportation',
  //   programs: ['CDL Training (Class A)'],
  // },
];

const FROM_EMAIL = 'noreply@elevateforhumanity.org';
const FROM_NAME = 'Elizabeth Greene | ' + PLATFORM_DEFAULTS.orgName + '';
const REPLY_TO = 'elevate4humanityedu@gmail.com';
const CC_EMAIL = 'elevate4humanityedu@gmail.com';

// ── Email builder ─────────────────────────────────────────────────────────────

function buildSubject(_recipient: (typeof RECIPIENTS)[0]): string {
  return `Partnership Opportunity — Elevate for Humanity`;
}

function buildPlainText(recipient: (typeof RECIPIENTS)[0]): string {
  const programList = recipient.programs.map((p) => `  • ${p}`).join('\n');
  return [
    `Hello,`,
    '',
    'My name is Elizabeth Greene, Founder and CEO of Elevate for Humanity Technical and Career Institute in Indianapolis, Indiana.',
    '',
    'I am reaching out to invite ' + recipient.company + ' to join our employer partner network.',
    '',
    'We provide fully funded workforce training through Indiana\'s SNAP E&T (IMPACT) program. Our graduates are credentialed, job-ready, and available to hire at no cost to you.',
    '',
    'Programs we train for that are relevant to your organization:',
    programList,
    '',
    'What we are asking:',
    '  A simple one-page Memorandum of Understanding (MOU) that takes about 5 minutes to complete.',
    '  There is no financial obligation. This is a hiring partnership only.',
    '',
    'To get started, please reply to this email or call me directly at ' + PLATFORM_DEFAULTS.supportPhone + '.',
    'I will send you the MOU and walk you through it personally.',
    '',
    'Thank you for your time. I look forward to connecting.',
    '',
    'Elizabeth Greene',
    'Founder & CEO',
    'Elevate for Humanity Technical and Career Institute',
    '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240',
    'elevate4humanityedu@gmail.com',
    '' + PLATFORM_DEFAULTS.supportPhone + '',
  ].join('\n');
}

function buildHtml(recipient: (typeof RECIPIENTS)[0]): string {
  const programRows = recipient.programs
    .map((p) => `<tr><td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">✓&nbsp;&nbsp;${p}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">

  <!-- Header bar -->
  <tr><td style="background:#0e3a7d;padding:28px 40px 24px;">
    <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;font-family:Arial,sans-serif;">" + PLATFORM_DEFAULTS.orgName + "</p>
    <p style="margin:4px 0 0;color:#93b8f0;font-size:12px;font-family:Arial,sans-serif;letter-spacing:0.04em;">TECHNICAL AND CAREER INSTITUTE &nbsp;·&nbsp; INDIANAPOLIS, INDIANA</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:40px 40px 32px;">

    <p style="margin:0 0 20px;color:#1e293b;font-size:15px;line-height:1.7;">Hello,</p>

    <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.8;">
      My name is <strong>Elizabeth Greene</strong>. I am the Founder and CEO of
      <strong>Elevate for Humanity Technical and Career Institute</strong> in Indianapolis, Indiana.
    </p>

    <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.8;">
      I am reaching out to invite <strong>${recipient.company}</strong> to become an official
      employer partner in our workforce development network. We train and credential workers
      through Indiana&rsquo;s SNAP E&amp;T (IMPACT) program &mdash; meaning our graduates
      arrive job-ready and their training is fully funded by the state.
    </p>

    <!-- Programs table -->
    <p style="margin:0 0 8px;color:#0e3a7d;font-size:12px;font-weight:bold;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.06em;">Programs relevant to your organization</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;margin:0 0 24px;">
      ${programRows}
    </table>

    <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.8;">
      We are asking you to sign a one-page <strong>Memorandum of Understanding (MOU)</strong>
      that makes your organization an official Elevate hiring partner. There is
      <strong>no financial obligation</strong> &mdash; this is a hiring partnership only.
      It takes about five minutes to complete.
    </p>

    <!-- What you get -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:0;margin:0 0 28px;">
      <tr><td style="padding:16px 20px 8px;">
        <p style="margin:0 0 10px;color:#0e3a7d;font-size:12px;font-weight:bold;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.06em;">What you get as a partner</p>
      </td></tr>
      <tr><td style="padding:0 20px 16px;">
        <p style="margin:0 0 6px;color:#334155;font-size:13px;line-height:1.7;">&bull;&nbsp; First access to credentialed graduates before they hit the open market</p>
        <p style="margin:0 0 6px;color:#334155;font-size:13px;line-height:1.7;">&bull;&nbsp; Graduates whose training is state-funded &mdash; no cost to hire</p>
        <p style="margin:0 0 6px;color:#334155;font-size:13px;line-height:1.7;">&bull;&nbsp; A direct line to Elizabeth for staffing needs</p>
        <p style="margin:0;color:#334155;font-size:13px;line-height:1.7;">&bull;&nbsp; No ongoing obligation &mdash; one-year agreement, cancel anytime with 30 days notice</p>
      </td></tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr><td align="center">
        <a href="${SITE_URL}/mou/employer"
           style="display:inline-block;background:#0e3a7d;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:4px;font-size:15px;font-weight:bold;font-family:Arial,sans-serif;">
          Complete the MOU &rarr;
        </a>
        <p style="margin:10px 0 0;font-size:12px;color:#64748b;font-family:Arial,sans-serif;">
          Or reply to this email and I will send it directly.
        </p>
      </td></tr>
    </table>

    <p style="margin:0 0 6px;color:#334155;font-size:14px;line-height:1.8;">
      Please feel free to call me directly at <strong>" + PLATFORM_DEFAULTS.supportPhone + "</strong> with any questions.
    </p>

    <p style="margin:24px 0 0;color:#334155;font-size:14px;line-height:1.8;">
      Sincerely,<br><br>
      <strong style="font-size:15px;">Elizabeth Greene</strong><br>
      Founder &amp; Chief Executive Officer<br>
      Elevate for Humanity Technical and Career Institute<br>
      <a href="mailto:${REPLY_TO}" style="color:#0e3a7d;text-decoration:none;">${REPLY_TO}</a> &nbsp;&middot;&nbsp; " + PLATFORM_DEFAULTS.supportPhone + "
    </p>

  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.8;font-family:Arial,sans-serif;">
      8888 Keystone Crossing, Suite 1300 &nbsp;&middot;&nbsp; Indianapolis, IN 46240<br>
      DOL Registered Apprenticeship Sponsor &nbsp;&middot;&nbsp; Indiana ETPL Listed &nbsp;&middot;&nbsp; WorkOne Partner
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── SendGrid sender ───────────────────────────────────────────────────────────

function sendEmail(recipient: (typeof RECIPIENTS)[0]): Promise<void> {
  const payload = JSON.stringify({
    personalizations: [
      {
        to: [{ email: recipient.email, name: recipient.name }],
        cc: [{ email: CC_EMAIL, name: 'Elizabeth Greene' }],
      },
    ],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    reply_to: { email: REPLY_TO, name: 'Elizabeth Greene' },
    subject: buildSubject(recipient),
    content: [
      { type: 'text/plain', value: buildPlainText(recipient) },
      { type: 'text/html', value: buildHtml(recipient) },
    ],
  });

  return new Promise((resolve, reject) => {
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
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode === 202) {
            resolve();
          } else {
            reject(new Error(`SendGrid ${res.statusCode}: ${body}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\nFaatin Azar MOU batch — ${RECIPIENTS.length} recipient(s)`);
  if (DRY_RUN) console.log('DRY RUN — no emails will be sent\n');

  for (const recipient of RECIPIENTS) {
    const subject = buildSubject(recipient);
    const plain = buildPlainText(recipient);
    console.log(`\n→ ${recipient.company} <${recipient.email}>`);
    console.log(`  Subject: ${subject}`);
    console.log(`\n--- EMAIL BODY ---\n${plain}\n--- END ---`);

    if (DRY_RUN) {
      console.log('  [DRY RUN] Would send email');
      continue;
    }

    try {
      await sendEmail(recipient);
      console.log('  ✅ Sent');
    } catch (err) {
      console.error(`  ❌ Failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log('\nDone.');
  if (DRY_RUN) {
    console.log('Run without --dry-run to send for real.');
  }
})();
