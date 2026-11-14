#!/usr/bin/env tsx
/**
 * Resend corrected portal links (magic link → /auth/callback → chronological destination).
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/resend-outreach-portal-links.ts
 *   pnpm tsx --env-file=.env.local scripts/ops/resend-outreach-portal-links.ts --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { outboundSiteUrl } from './outbound-site-url';
import {
  buildJourneyLinks,
  journeyStepsHtml,
  type OutreachPersona,
} from './outreach-auth-link';
import { assertOutreachEmailAllowed } from './outreach-email-guard';

const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';
const DRY_RUN = process.argv.includes('--dry-run');
const SITE_URL = outboundSiteUrl();

const RECIPIENTS: {
  email: string;
  name: string;
  shopOrOrg: string;
  persona: OutreachPersona;
}[] = [
  {
    email: 'info@enchantedheartstraining.com',
    name: 'Shawndra Quinn, RN',
    shopOrOrg: 'Enchanted Hearts Training Institute LLC',
    persona: 'program_holder',
  },
  {
    email: 'calvincutz1985@gmail.com',
    name: 'Calvin Pena',
    shopOrOrg: "Cal's Kutz Studio",
    persona: 'partner',
  },
  {
    email: 'christopherd.newkirk@gmail.com',
    name: 'Chris Newkirk',
    shopOrOrg: "B-52's Barber Shop LLC",
    persona: 'partner',
  },
  {
    email: 'info@prestigeelevation.com',
    name: 'Elizabeth L. Greene',
    shopOrOrg: 'Prestige Elevation Barber and Beauty Institute LLC',
    persona: 'partner',
  },
];

async function loadSendGridKey(db: ReturnType<typeof createClient>) {
  if (process.env.SENDGRID_API_KEY) return process.env.SENDGRID_API_KEY;
  const { data } = await db.from('platform_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  if (data?.value) return data.value as string;
  const { data: app } = await db.from('app_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  return (app?.value as string) ?? null;
}

function buildEmail(
  firstName: string,
  org: string,
  persona: OutreachPersona,
  stepsHtml: string,
) {
  const portalLabel = persona === 'program_holder' ? 'Program Holder' : 'Partner';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#1e293b;padding:24px 32px">
<p style="margin:0;color:#fff;font-size:18px;font-weight:700">${PLATFORM_DEFAULTS.orgName}</p>
<p style="margin:6px 0 0;color:#94a3b8;font-size:13px">${portalLabel} portal — corrected access links</p>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;font-size:15px">Hi ${firstName},</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
Some earlier emails included broken links (for example <code>localhost</code>). Please <strong>disregard those</strong>.
Use the steps below <strong>in order</strong> — each button signs you in and takes you to the correct page on
<strong>${SITE_URL}</strong> for <strong>${org}</strong>.
</p>
<p style="margin:0 0 12px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;color:#1e293b">Your steps</p>
${stepsHtml}
<p style="margin:0 0 16px;font-size:13px;color:#64748b">Links expire after a short time. You can always sign in at
<a href="${SITE_URL}/login" style="color:#dc2626">${SITE_URL}/login</a> with your email and use the same paths above.</p>
<p style="margin:0;font-size:13px;color:#475569">Questions? Reply to this email or call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>.</p>
<p style="margin:24px 0 0;font-size:14px">Warm regards,<br><strong>Elizabeth Greene</strong><br>${PLATFORM_DEFAULTS.orgName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function main() {
  assertOutreachEmailAllowed('resend-outreach-portal-links.ts');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) process.exit(1);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const sgKey = await loadSendGridKey(db);
  if (!sgKey && !DRY_RUN) {
    console.error('SENDGRID_API_KEY not found');
    process.exit(1);
  }

  console.log(DRY_RUN ? 'DRY RUN' : 'LIVE', `— site ${SITE_URL}\n`);

  for (const r of RECIPIENTS) {
    const first = r.name.split(' ')[0];
    const { steps } = await buildJourneyLinks(db, r.email, r.persona);
    const stepsHtml = journeyStepsHtml(steps, { primaryIndex: 0 });
    const html = buildEmail(first, r.shopOrOrg, r.persona, stepsHtml);
    const subject = `[Corrected Links] ${r.shopOrOrg} — portal access (use in order)`;

    if (DRY_RUN) {
      console.log(`Would send → ${r.email} (${r.persona})`);
      steps.forEach((s, i) => console.log(`  ${i + 1}. ${s.label}`));
      continue;
    }

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: r.email, name: r.name }],
            cc: [{ email: ELEVATE_COPY, name: 'Elevate Admin Copy' }],
          },
        ],
        from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
        reply_to: { email: ELEVATE_COPY, name: 'Elizabeth Greene' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (res.status !== 202) throw new Error(`${r.email}: SendGrid ${res.status} ${await res.text()}`);
    console.log(`✅ ${r.email} — ${steps.length} chronological steps`);
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
