#!/usr/bin/env tsx
/**
 * Write HTML previews of ops outreach emails and send copies to Elevate admin.
 * Uses production URLs only (never localhost).
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/send-email-copies-to-admin.ts
 *   pnpm tsx --env-file=.env.local scripts/ops/send-email-copies-to-admin.ts --write-only
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { outboundSiteUrl } from './outbound-site-url';
import { assertOutreachEmailAllowed } from './outreach-email-guard';

const SITE_URL = outboundSiteUrl();
const ADMIN = 'elevate4humanityedu@gmail.com';
const WRITE_ONLY = process.argv.includes('--write-only');

const ENCHANTED = {
  organizationName: 'Enchanted Hearts Training Institute LLC',
  contactName: 'Shawndra Quinn, RN',
  email: 'info@enchantedheartstraining.com',
};

const BARBER_HOST = {
  shopName: "Cal's Kutz Studio",
  contactName: 'Calvin Pena',
  email: 'calvincutz1985@gmail.com',
};

const REQUIRED_DOCS = [
  'IRS EIN Assignment Letter (CP 575 or 147C)',
  'W-9 Form (signed)',
  'Indiana Barbershop License (current, full copy)',
  "Workers' Compensation Certificate of Insurance",
  'General Liability Insurance Certificate',
  'Supervising Barber License (2+ years experience)',
];

function enchantedMouHtml() {
  const signUrl = `${SITE_URL}/login?redirect=${encodeURIComponent('/program-holder/sign-mou')}`;
  const first = 'Shawndra';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#1e293b;padding:24px 32px">
<p style="margin:0;color:#fff;font-size:18px;font-weight:700">${PLATFORM_DEFAULTS.orgName}</p>
<p style="margin:6px 0 0;color:#94a3b8;font-size:13px">Third-Party Program Holder MOU</p>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;font-size:15px">Dear ${first},</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
Thank you for partnering with <strong>Elevate for Humanity</strong> as a <strong>third-party program delivery partner</strong>
for <strong>${ENCHANTED.organizationName}</strong>.
</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
<strong>Attached:</strong> your <strong>Program Holder Memorandum of Understanding (MOU)</strong> (PDF).
</p>
<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7;color:#475569">
<li>Review the attached PDF.</li>
<li>Click below to <strong>digitally sign</strong> (log in with <strong>${ENCHANTED.email}</strong> if prompted).</li>
<li>Reply to this email with questions or a signed copy if you prefer.</li>
</ol>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="background:#dc2626;border-radius:8px;padding:14px 24px">
<a href="${signUrl}" style="color:#fff;font-size:15px;font-weight:bold;text-decoration:none">Sign Program Holder MOU Online →</a>
</td></tr></table>
<p style="margin:0;font-size:13px;color:#475569">Questions? Reply to this email or call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>.</p>
<p style="margin:24px 0 0;font-size:14px">Warm regards,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO, ${PLATFORM_DEFAULTS.orgName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function barberHostMouHtml() {
  const first = BARBER_HOST.contactName.split(` ')[0];
  const signUrl = `${SITE_URL}/login?redirect=${encodeURIComponent('/partners/barber-host-shop/sign-mou')}`;
  const docList = REQUIRED_DOCS.map((d) => `<li style="margin-bottom:8px">${d}</li>`).join('');
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
Your barber apprenticeship <strong>host shop application</strong> for <strong>${BARBER_HOST.shopName}</strong> is approved.
<strong>Attached</strong> is your Barber Host Shop Employer Agreement (MOU).
</p>
<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7;color:#475569">
<li>Review the attached MOU PDF.</li>
<li>Click below to <strong>digitally sign</strong> (log in with <strong>${BARBER_HOST.email}</strong>).</li>
<li>Reply with required documents listed below.</li>
</ol>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="background:#dc2626;border-radius:8px;padding:14px 24px">
<a href="${signUrl}" style="color:#fff;font-size:15px;font-weight:bold;text-decoration:none">Sign Barber Host Shop MOU Online →</a>
</td></tr></table>
<p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#475569"><strong>Required documents</strong> — reply with PDF attachments:</p>
<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7;color:#475569">${docList}</ol>
<p style="margin:0;font-size:13px;color:#475569">Questions? Reply to this email or call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>.</p>
<p style="margin:24px 0 0;font-size:14px">Warm regards,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO, ${PLATFORM_DEFAULTS.orgName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const TEMPLATES: { id: string; subject: string; intendedTo: string; html: string; note: string }[] = [
  {
    id: 'enchanted-program-holder-mou',
    subject: `Program Holder MOU — ${ENCHANTED.organizationName} (signature required)`,
    intendedTo: ENCHANTED.email,
    html: enchantedMouHtml(),
    note: 'Current canonical template — MOU PDF attachment + sign link only. NO dashboard email.',
  },
  {
    id: 'barber-host-mou-calvin-example',
    subject: `Barber Host Shop MOU & required documents — ${BARBER_HOST.shopName}`,
    intendedTo: BARBER_HOST.email,
    html: barberHostMouHtml(),
    note: 'Barber host template — MOU PDF + sign link + document checklist. NO dashboard link.',
  },
];

async function loadSendGridKey(db: ReturnType<typeof createClient>) {
  if (process.env.SENDGRID_API_KEY) return process.env.SENDGRID_API_KEY;
  const { data } = await db.from('platform_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  if (data?.value) return data.value as string;
  const { data: app } = await db.from('app_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  return (app?.value as string) ?? null;
}

async function main() {
  const outDir = join(process.cwd(), 'exports', 'email-copies');
  mkdirSync(outDir, { recursive: true });

  const indexLines = [`# Ops email copies — ${new Date().toISOString()}`, `Site URL used in links: ${SITE_URL}`, ''];

  for (const t of TEMPLATES) {
    const path = join(outDir, `${t.id}.html`);
    writeFileSync(path, t.html, 'utf8');
    indexLines.push(`## ${t.id}`, `- Intended recipient: ${t.intendedTo}`, `- Subject: ${t.subject}`, `- ${t.note}`, `- File: ${path}`, '');
    console.log(`Wrote ${path}`);
  }

  writeFileSync(join(outDir, 'README.md'), indexLines.join('\n'), 'utf8');

  if (WRITE_ONLY) {
    console.log('\nWrite-only mode — not sending email.');
    return;
  }

  assertOutreachEmailAllowed('send-email-copies-to-admin.ts');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) process.exit(1);
  const db = createClient(url, key, { auth: { persistSession: false } });
  const sgKey = await loadSendGridKey(db);
  if (!sgKey) {
    console.error('SENDGRID_API_KEY not found');
    process.exit(1);
  }

  for (const t of TEMPLATES) {
    const wrapper = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:16px">
<p style="background:#fef3c7;border:1px solid #f59e0b;padding:12px;border-radius:8px;font-size:13px">
<strong>ADMIN COPY</strong> — intended for <strong>${t.intendedTo}</strong><br/>
${t.note}<br/>
All links use <strong>${SITE_URL}</strong> (production — not localhost).
</p>
<hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0"/>
${t.html}
</div>`;

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: ADMIN, name: 'Elizabeth Greene' }] }],
        from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate Ops | Email Copies' },
        reply_to: { email: ADMIN },
        subject: `[COPY] ${t.subject}`,
        content: [{ type: 'text/html', value: wrapper }],
      }),
    });
    if (res.status !== 202) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
    console.log(`Sent copy to ${ADMIN}: ${t.subject}`);
  }

  console.log('\nDone. HTML files also in exports/email-copies/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
