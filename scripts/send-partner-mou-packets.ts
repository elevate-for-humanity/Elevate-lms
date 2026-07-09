#!/usr/bin/env tsx
/**
 * Sends MOU packets to all program holders and employer partners.
 * Each recipient gets a personalized email with the MOU PDF attached.
 *
 * Usage:
 *   pnpm tsx scripts/send-partner-mou-packets.ts --dry-run
 *   pnpm tsx scripts/send-partner-mou-packets.ts
 */

import * as https from 'https';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const API_KEY = process.env.SENDGRID_API_KEY ?? '';
const DRY_RUN = process.argv.includes('--dry-run');
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

if (!API_KEY && !DRY_RUN) {
  console.error('SENDGRID_API_KEY is required');
  process.exit(1);
}

// ── Recipients ────────────────────────────────────────────────────────────────
// Program holders from system (active + pending MOU)
const PROGRAM_HOLDERS = [
  {
    org: "Ameco's Enterprise LLC",
    contact: 'Ameco Martin',
    email: 'amecosenterprise@gmail.com',
    phone: '317-912-8000',
    type: 'Program Holder',
    mou_signed: true,
    programs: ['IT Help Desk / CompTIA A+', 'Cybersecurity Analyst', 'Network Administration', 'Web Development', 'Software Development', 'Graphic Design', 'Bookkeeping & QuickBooks', 'Business Administration'],
  },
  {
    org: 'Rebuilds Mind and Body Studio LLC',
    contact: 'Naomi Jordan',
    email: 'rebuildsmindbodystudio2025@outlook.com',
    phone: '',
    type: 'Program Holder',
    mou_signed: true,
    programs: ['CNA / Certified Nursing Assistant', 'Home Health Aide (HHA)', 'Phlebotomy Technician', 'Qualified Medication Aide (QMA)', 'Medical Assistant', 'Peer Recovery Specialist'],
  },
  {
    org: 'Center of Destiny',
    contact: 'Dr. Carlina A. Wilkes',
    email: 'info@centerofdestiny.org',
    phone: '',
    type: 'Program Holder',
    mou_signed: true,
    programs: ['Multiple Programs'],
  },
  {
    org: 'First Class Training Center',
    contact: 'David Nazaire',
    email: 'hr@firstclasstraining.org',
    phone: '215-214-9355',
    type: 'Program Holder',
    mou_signed: true,
    programs: ['HVAC Technician'],
  },
  {
    org: 'Mesmerized by Beauty Cosmetology Academy',
    contact: 'Jozanna George',
    email: 'mesmerizedbybeautyl@yahoo.com',
    phone: '',
    type: 'Program Holder',
    mou_signed: false,
    programs: ['Cosmetology Apprenticeship'],
  },
  {
    org: 'Doreen Hawkins',
    contact: 'Doreen Hawkins',
    email: 'doreen.hawkins01@outlook.com',
    phone: '',
    type: 'Program Holder',
    mou_signed: true,
    programs: ['Multiple Programs'],
  },
  {
    org: 'LoopRoots Foundation',
    contact: 'Marketta Kirby',
    email: 'info@looproots.org',
    phone: '302-215-6333',
    type: 'Program Holder',
    mou_signed: true,
    programs: ['Multiple Programs'],
  },
  {
    org: 'Kountry Kutz Barbershop',
    contact: 'Adam Kriech',
    email: 'adamkriech1@gmail.com',
    phone: '317-294-5165',
    type: 'Program Holder',
    mou_signed: true,
    programs: ['Barber Apprenticeship'],
  },
];

// Employer partners — MOU outreach + CDL referral
const EMPLOYER_PARTNERS = [
  {
    org: 'Guiding Angels Care',
    contact: 'Team',
    email: 'guidingangels.care@gmail.com',
    phone: '',
    type: 'Employer Partner',
    mou_signed: false,
    programs: ['CNA / Healthcare', 'Peer Recovery Specialist'],
  },
  {
    org: 'Harmony Heights Care',
    contact: 'Team',
    email: 'harmonyheights.care@gmail.com',
    phone: '',
    type: 'Employer Partner',
    mou_signed: false,
    programs: ['CNA / Healthcare', 'Peer Recovery Specialist'],
  },
  {
    org: 'Cradle to Crayons Academy',
    contact: 'Team',
    email: 'cradletocrayonsacademy@gmail.com',
    phone: '',
    type: 'Employer Partner',
    mou_signed: false,
    programs: ['CNA / Healthcare', 'Peer Recovery Specialist', 'IT Help Desk'],
  },
  {
    org: 'Driver Solutions',
    contact: 'D. McClain',
    email: 'dmcclain@driversolutions.com',
    phone: '',
    type: 'CDL Referral Partner',
    mou_signed: false,
    programs: ['CDL Class A', 'CDL Class B'],
  },
];

const ALL_RECIPIENTS = [...PROGRAM_HOLDERS, ...EMPLOYER_PARTNERS];

// ── Email builder ─────────────────────────────────────────────────────────────
function buildEmail(r: typeof ALL_RECIPIENTS[0], pdfB64: string): string {
  const firstName = r.contact.split(' ')[0];
  const programList = r.programs.map(p => `  - ${p}`).join('\n');
  const mouUrl = `${SITE_URL}/mou/employer`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#0e3a7d;padding:32px 40px;">
          <img src="${SITE_URL}/images/logo.png" alt="Elevate for Humanity" height="60" style="display:block;margin-bottom:12px;" />
          <h1 style="margin:0;color:#ffffff;font-size:22px;">Partnership Agreement</h1>
          <p style="margin:6px 0 0;color:#93b4e8;font-size:14px;">Elevate for Humanity Technical and Career Institute</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="font-size:16px;color:#1a1a2e;margin:0 0 16px;">Dear ${firstName},</p>

          <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 16px;">
            Thank you for your partnership with <strong>Elevate for Humanity Technical and Career Institute</strong>.
            We are excited to formalize our collaboration through this Memorandum of Understanding (MOU).
          </p>

          <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 16px;">
            <strong>Organization:</strong> ${r.org}<br>
            <strong>Partnership Type:</strong> ${r.type}<br>
            <strong>Programs:</strong> ${r.programs.join(', `)}
          </p>

          <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 24px;">
            Your MOU document is attached to this email as a PDF. Please review it carefully.
            You can also sign electronically by clicking the button below.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background:#0e3a7d;border-radius:8px;padding:14px 28px;">
              <a href="${mouUrl}" style="color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">
                Review &amp; Sign MOU Online
              </a>
            </td></tr>
          </table>

          <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 16px;">
            If you have any questions, please contact Elizabeth Greene directly:
          </p>
          <p style="font-size:13px;color:#444;margin:0 0 32px;">
            <strong>Phone:</strong> (317) 314-3757<br>
            <strong>Email:</strong> elevate4humanityedu@gmail.com<br>
            <strong>Address:</strong> 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240
          </p>

          <p style="font-size:14px;color:#1a1a2e;margin:0;">
            Warm regards,<br>
            <strong>Elizabeth Greene</strong><br>
            Founder &amp; CEO, Elevate for Humanity
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f0f4ff;padding:20px 40px;border-top:1px solid #e0e7ff;">
          <p style="font-size:11px;color:#888;margin:0;text-align:center;">
            Elevate for Humanity Technical and Career Institute &nbsp;|&nbsp;
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br>
            ${PLATFORM_DEFAULTS.supportPhone} &nbsp;|&nbsp; elevate4humanityedu@gmail.com &nbsp;|&nbsp;
            <a href="${SITE_URL}" style="color:#0e3a7d;">elevateforhumanity.org</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Dear ${firstName},`,
    `',
    `Thank you for your partnership with Elevate for Humanity Technical and Career Institute.`,
    `We are excited to formalize our collaboration through this Memorandum of Understanding (MOU).`,
    '',
    `Organization: ${r.org}`,
    `Partnership Type: ${r.type}`,
    `Programs:\n${programList}`,
    '',
    `Your MOU document is attached to this email as a PDF. Please review it carefully.`,
    `You can also sign electronically at: ${mouUrl}`,
    '',
    `Questions? Contact Elizabeth Greene:`,
    `Phone: ' + PLATFORM_DEFAULTS.supportPhone + '',
    `Email: elevate4humanityedu@gmail.com`,
    '',
    `Warm regards,`,
    `Elizabeth Greene`,
    `Founder & CEO, Elevate for Humanity`,
  ].join('\n');

  return JSON.stringify({
    personalizations: [{ to: [{ email: r.email, name: r.contact }] }],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
    reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
    subject: `Partnership MOU — Elevate for Humanity x ${r.org}`,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html },
    ],
    attachments: [
      {
        content: pdfB64,
        type: 'application/pdf',
        filename: `Elevate-MOU-${r.org.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
        disposition: 'attachment',
      },
    ],
  });
}

// ── Send ──────────────────────────────────────────────────────────────────────
function sendEmail(payload: string): Promise<void> {
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
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode === 202) resolve();
          else reject(new Error(`SendGrid ${res.statusCode}: ${body}`));
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
  const { generateEmployerMOUPdf } = await import('../lib/documents/generate-employer-mou-pdf');

  console.log(`\nRecipients (${ALL_RECIPIENTS.length} total):`);
  for (const r of ALL_RECIPIENTS) {
    const signed = r.mou_signed ? '[MOU signed]' : '[MOU pending]';
    console.log(`  ${signed} ${r.org} — ${r.contact} <${r.email}>`);
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Generating one sample MOU to verify PDF output...');
    const sample = ALL_RECIPIENTS[0];
    const sampleBytes = await generateEmployerMOUPdf({
      employer_name: sample.org,
      signer_name: sample.contact,
      signer_title: sample.type,
      contact_email: sample.email,
      contact_phone: sample.phone || '',
      programs: sample.programs,
      signed_at: new Date().toISOString(),
      mou_version: '2026-partner-01',
    });
    console.log(`Sample MOU generated — ${Math.round(sampleBytes.length / 1024)} KB`);
    console.log('[DRY RUN] No emails sent. Run without --dry-run to send.');
    return;
  }

  console.log('\nGenerating personalized MOUs and sending...');
  let sent = 0;
  let failed = 0;

  for (const r of ALL_RECIPIENTS) {
    try {
      // Generate a personalized MOU PDF for this recipient
      const pdfBytes = await generateEmployerMOUPdf({
        employer_name: r.org,
        signer_name: r.contact,
        signer_title: r.type,
        contact_email: r.email,
        contact_phone: r.phone || '',
        programs: r.programs,
        signed_at: new Date().toISOString(),
        mou_version: '2026-partner-01',
      });
      const pdfB64 = Buffer.from(pdfBytes).toString('base64');

      const payload = buildEmail(r, pdfB64);
      await sendEmail(payload);
      console.log(`  ✅ Sent (${Math.round(pdfBytes.length / 1024)} KB MOU) -> ${r.contact} <${r.email}>`);
      sent++;
      // Respect SendGrid rate limits
      await new Promise(res => setTimeout(res, 400));
    } catch (err) {
      console.error(`  ❌ FAILED -> ${r.email}: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone. ${sent} sent, ${failed} failed.`);
})();
