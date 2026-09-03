#!/usr/bin/env tsx
/**
 * Send individual barber host shop MOU (PDF + sign link) to Aaron Brown / Razors Image.
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/send-aaron-barber-mou.ts
 */
import { createClient } from '@supabase/supabase-js';
import { generateMOUPdf } from '@/lib/documents/generate-mou-pdf';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { outboundSiteUrl } from './outbound-site-url';
import { buildJourneyLinks, journeyStepsHtml } from './outreach-auth-link';
import { assertOutreachEmailAllowed } from './outreach-email-guard';

const SITE_URL = outboundSiteUrl();
const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';

const HOST = {
  shopName: 'Razors Image Barbershop',
  contactName: 'Aaron Brown',
  email: 'razorsimage11@gmail.com',
  signerTitle: 'Owner / Licensed Barber',
  supervisorLicense: 'BA11400162',
  compensationModel: 'hourly',
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

function buildEmailHtml(stepsHtml: string) {
  const first = HOST.contactName.split(' `)[0];
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#1e293b;padding:24px 32px">
<p style="margin:0;color:#fff;font-size:18px;font-weight:700">${PLATFORM_DEFAULTS.orgName}</p>
<p style="margin:6px 0 0;color:#94a3b8;font-size:13px">Barber Host Shop Employer Agreement (MOU)</p>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;font-size:15px">Hi ${first},</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
Thank you for partnering with <strong>Elevate for Humanity</strong> as a <strong>barber apprenticeship host barbershop</strong>
for <strong>${HOST.shopName}</strong>.
</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
<strong>Attached:</strong> your individual <strong>Barber Host Shop Employer Agreement (MOU)</strong> for review and signature.
</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#475569">Review the attached PDF, then complete these steps <strong>in order</strong> on ${SITE_URL}:</p>
${stepsHtml}
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
After we receive your signed MOU, Elizabeth will follow up with next steps for onboarding apprentices.
</p>
<p style="margin:0;font-size:13px;color:#475569">Questions? Reply here or call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>.</p>
<p style="margin:24px 0 0;font-size:14px">Warm regards,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO, ${PLATFORM_DEFAULTS.orgName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function main() {
  assertOutreachEmailAllowed('send-aaron-barber-mou.ts');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === 'placeholder') {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const sgKey = await loadSendGridKey(db);
  if (!sgKey) {
    console.error('SENDGRID_API_KEY not found');
    process.exit(1);
  }

  const { steps } = await buildJourneyLinks(db, HOST.email, 'partner');
  const stepsHtml = journeyStepsHtml(steps, { primaryIndex: 0 });
  const pdfBytes = await generateMOUPdf({
    shop_name: HOST.shopName,
    signer_name: HOST.contactName,
    signer_title: HOST.signerTitle,
    supervisor_name: HOST.contactName,
    supervisor_license: HOST.supervisorLicense,
    compensation_model: HOST.compensationModel,
    signed_at: new Date().toISOString(),
    mou_version: '2025-barber-01',
  });
  const pdfB64 = Buffer.from(pdfBytes).toString('base64');
  const filename = `Elevate-Barber-Host-MOU-${HOST.shopName.replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`;

  const payload = {
    personalizations: [
      {
        to: [{ email: HOST.email, name: HOST.contactName }],
        cc: [{ email: ELEVATE_COPY, name: 'Elevate Admin Copy' }],
      },
    ],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
    reply_to: { email: ELEVATE_COPY, name: 'Elizabeth Greene' },
    subject: `Barber Host Shop Employer Agreement (MOU) — ${HOST.shopName}`,
    content: [{ type: 'text/html', value: buildEmailHtml(stepsHtml) }],
    attachments: [
      {
        content: pdfB64,
        type: 'application/pdf',
        filename,
        disposition: 'attachment',
      },
    ],
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sgKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (res.status !== 202) {
    throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
  }

  console.log(`✅ Barber MOU sent to ${HOST.email} (CC ${ELEVATE_COPY})`);
  console.log(`   PDF: ${filename} (${Math.round(pdfBytes.length / 1024)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
