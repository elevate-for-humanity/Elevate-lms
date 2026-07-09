#!/usr/bin/env tsx
/**
 * Send separate host-shop MOU packets (PDF + direct sign link) — NOT via partner dashboard.
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/send-style-scissors-individual-mous.ts
 *   pnpm tsx --env-file=.env.local scripts/ops/send-style-scissors-individual-mous.ts --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import { generateMOUPdf } from '@/lib/documents/generate-mou-pdf';
import { generateCosmetologyMOUPdf } from '@/lib/documents/generate-cosmetology-mou-pdf';
import { generateNailMOUPdf } from '@/lib/documents/generate-nail-mou-pdf';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

import { outboundSiteUrl } from './outbound-site-url';
import { assertOutreachEmailAllowed } from './outreach-email-guard';

const SITE_URL = outboundSiteUrl();
const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';
const DRY_RUN = process.argv.includes('--dry-run');

const HOST = {
  shopName: 'Style and Scissors Salon',
  contactName: 'Corienne Meid',
  email: 'styleandscissorsalon@gmail.com',
  signerTitle: 'Owner / Supervising License Holder',
  supervisorName: 'Corienne Meid',
  supervisorLicense: 'BC20101024',
  compensationModel: 'hourly',
};

type ProgramPacket = {
  key: string;
  programLabel: string;
  filename: string;
  signPath: string;
  generatePdf: () => Promise<Uint8Array>;
};

async function loadSendGridKey(db: ReturnType<typeof createClient>) {
  if (process.env.SENDGRID_API_KEY) return process.env.SENDGRID_API_KEY;
  const { data } = await db
    .from('platform_secrets')
    .select('value')
    .eq('key', 'SENDGRID_API_KEY')
    .maybeSingle();
  if (data?.value) return data.value as string;
  const { data: app } = await db
    .from('app_secrets')
    .select('value')
    .eq('key', 'SENDGRID_API_KEY')
    .maybeSingle();
  return (app?.value as string) ?? null;
}

function buildEmailHtml(programLabel: string, signUrl: string) {
  const first = HOST.contactName.split(' `)[0];
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#1e293b;padding:24px 32px">
<p style="margin:0;color:#fff;font-size:18px;font-weight:700">${PLATFORM_DEFAULTS.orgName}</p>
<p style="margin:6px 0 0;color:#94a3b8;font-size:13px">Host Shop MOU — ${programLabel}</p>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;font-size:15px">Hi ${first},</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
Attached is your <strong>individual ${programLabel} Host Shop Memorandum of Understanding</strong> for
<strong>${HOST.shopName}</strong>. This is a separate employer agreement for this program only.
</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
<strong>How to sign:</strong>
</p>
<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7;color:#475569">
<li>Review the attached PDF.</li>
<li>Click below to open the <strong>digital signature page</strong> for this program (log in with <strong>${HOST.email}</strong> if prompted).</li>
<li>Sign with your finger, mouse, or stylus and submit — a signed copy is sent to Elevate automatically.</li>
<li>You may also reply to this email with the signed PDF attached if you prefer.</li>
</ol>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="background:#dc2626;border-radius:8px;padding:14px 24px">
<a href="${signUrl}" style="color:#fff;font-size:15px;font-weight:bold;text-decoration:none">Sign ${programLabel} MOU Online →</a>
</td></tr></table>
<p style="margin:0;font-size:13px;color:#475569">Questions? Reply here or call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>.</p>
<p style="margin:24px 0 0;font-size:14px">Warm regards,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO, ${PLATFORM_DEFAULTS.orgName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function sendWithAttachment(
  apiKey: string,
  opts: { to: string; subject: string; html: string; pdfB64: string; filename: string },
) {
  const payload = JSON.stringify({
    personalizations: [
      {
        to: [{ email: opts.to, name: HOST.contactName }],
        cc: [{ email: ELEVATE_COPY, name: `Elevate Admin Copy' }],
      },
    ],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
    reply_to: { email: ELEVATE_COPY, name: 'Elizabeth Greene' },
    subject: opts.subject,
    content: [{ type: 'text/html', value: opts.html }],
    attachments: [
      {
        content: opts.pdfB64,
        type: 'application/pdf',
        filename: opts.filename,
        disposition: 'attachment',
      },
    ],
  });

  if (DRY_RUN) {
    console.log(`  [DRY RUN] ${opts.subject} → ${opts.to} (CC ${ELEVATE_COPY})`);
    return;
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: payload,
  });
  if (res.status !== 202) {
    throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
  }
  console.log(`  ✅ Sent: ${opts.subject}`);
}

async function main() {
  assertOutreachEmailAllowed('send-style-scissors-individual-mous.ts');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === 'placeholder') {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const sgKey = await loadSendGridKey(db);
  if (!sgKey && !DRY_RUN) {
    console.error('SENDGRID_API_KEY not found');
    process.exit(1);
  }

  const draftDate = new Date().toISOString();
  const common = {
    signer_name: HOST.contactName,
    signer_title: HOST.signerTitle,
    supervisor_name: HOST.supervisorName,
    supervisor_license: HOST.supervisorLicense,
    compensation_model: HOST.compensationModel,
    signed_at: draftDate,
  };

  const packets: ProgramPacket[] = [
    {
      key: 'barber',
      programLabel: 'Barber Apprenticeship',
      filename: `Elevate-MOU-Barber-${HOST.shopName.replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`,
      signPath: '/partners/barber-host-shop/sign-mou',
      generatePdf: () =>
        generateMOUPdf({
          shop_name: HOST.shopName,
          mou_version: '2025-barber-01',
          ...common,
        }),
    },
    {
      key: 'cosmetology',
      programLabel: 'Cosmetology Apprenticeship',
      filename: `Elevate-MOU-Cosmetology-${HOST.shopName.replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`,
      signPath: '/partners/cosmetology-host-shop/sign-mou',
      generatePdf: () =>
        generateCosmetologyMOUPdf({
          salon_name: HOST.shopName,
          mou_version: '2025-cosmetology-01',
          ...common,
        }),
    },
    {
      key: 'nail',
      programLabel: 'Nail Technician Apprenticeship',
      filename: `Elevate-MOU-Nail-Technician-${HOST.shopName.replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`,
      signPath: '/partners/nail-technician-apprenticeship/sign-mou',
      generatePdf: () =>
        generateNailMOUPdf({
          salon_name: HOST.shopName,
          mou_version: '2025-nail-technician-01',
          ...common,
        }),
    },
  ];

  console.log(`\nSending ${packets.length} individual MOU packets to ${HOST.email}`);
  if (DRY_RUN) console.log('DRY RUN — no emails sent\n');

  for (const packet of packets) {
    const signUrl = `${SITE_URL}/login?redirect=${encodeURIComponent(packet.signPath)}`;
    const pdfBytes = await packet.generatePdf();
    const pdfB64 = Buffer.from(pdfBytes).toString('base64');
    console.log(`\n→ ${packet.programLabel} (${Math.round(pdfBytes.length / 1024)} KB)`);
    await sendWithAttachment(sgKey!, {
      to: HOST.email,
      subject: `${packet.programLabel} Host Shop MOU — ${HOST.shopName} (signature required)`,
      html: buildEmailHtml(packet.programLabel, signUrl),
      pdfB64,
      filename: packet.filename,
    });
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\nDone. Elevate copy CC on each message.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
