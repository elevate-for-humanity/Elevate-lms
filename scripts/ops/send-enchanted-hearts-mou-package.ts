#!/usr/bin/env tsx
/**
 * Send complete Program Holder MOU package to Enchanted Hearts:
 *   - Apology + disregard prior MOU emails
 *   - Part 1: Full workforce training MOU
 *   - Part 2: Payment, refund, reporting addendum
 *   - No dashboard emails (MOU + sign link only)
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/send-enchanted-hearts-mou-package.ts
 */
import { createClient } from '@supabase/supabase-js';
import { generateProgramHolderWorkforceMOUPdf } from '@/lib/documents/generate-program-holder-workforce-mou-pdf';
import { generateProgramHolderMOUPart2Pdf } from '@/lib/documents/generate-program-holder-mou-part2-pdf';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { outboundSiteUrl } from './outbound-site-url';
import { buildJourneyLinks, journeyStepsHtml } from './outreach-auth-link';
import { assertOutreachEmailAllowed } from './outreach-email-guard';

const SITE_URL = outboundSiteUrl();
const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';

const HOLDER = {
  organizationName: 'Enchanted Hearts Training Institute LLC',
  contactName: 'Shawndra Quinn, RN',
  signerTitle: 'Training Program Director / Owner',
  email: 'info@enchantedheartstraining.com',
  phone: '3175347471',
  ein: '88-2052776',
  addressLine1: '650 N. Girls School Rd, Ste B20',
  city: 'Indianapolis',
  state: 'IN',
  zip: '46214',
  userId: '44f2d0cb-c966-401c-83e7-6e231fd6cb63',
  holderId: 'ac01769d-c1d9-496c-981e-f7963e6d0f48',
};

const PROGRAMS = [
  {
    program_name: 'Certified Nurse Aide (CNA) Training',
    credential: 'Indiana Nurse Aide (ISDH-approved program)',
    duration: '105 hours (75 classroom + 30 clinical)',
    weekly_hours: 0,
    tuition: 399,
  },
  {
    program_name: 'Home Health Aide (HHA) Training',
    credential: 'Home Health Aide Certificate',
    duration: '75 hours (2 weeks)',
    weekly_hours: 0,
    tuition: 399,
  },
  {
    program_name: 'Qualified Medication Aide (QMA) Program',
    credential: 'Indiana QMA (IDOH-approved)',
    duration: '100 hours (classroom/lab + supervised clinical practicum)',
    weekly_hours: 0,
    tuition: 900,
  },
  {
    program_name: 'QMA Insulin Administration Certification',
    credential: 'QMA Insulin Administration',
    duration: '6–12 hours',
    weekly_hours: 0,
    tuition: 275,
  },
  {
    program_name: 'CPR Instructor Course',
    credential: 'AHA-aligned CPR/BLS Instructor',
    duration: '1 day',
    weekly_hours: 0,
    tuition: 450,
  },
];

const PROGRAM_LINKS = [
  { id: 'fb36dbf1-db3c-4d34-adf9-3f98f397d371', slug: 'cna' },
  { id: 'd8f45366-1838-4539-ae32-7bc985773772', slug: 'home-health-aide' },
];

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

async function sendMail(
  apiKey: string,
  opts: {
    to: string;
    subject: string;
    html: string;
    attachments?: { content: string; filename: string }[];
  },
) {
  const payload = {
    personalizations: [
      {
        to: [{ email: opts.to, name: HOLDER.contactName }],
        cc: [{ email: ELEVATE_COPY, name: 'Elevate Admin Copy' }],
      },
    ],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
    reply_to: { email: ELEVATE_COPY, name: 'Elizabeth Greene' },
    subject: opts.subject,
    content: [{ type: 'text/html', value: opts.html }],
    attachments: opts.attachments?.map((a) => ({
      content: a.content,
      type: 'application/pdf',
      filename: a.filename,
      disposition: 'attachment',
    })),
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status !== 202) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
}

async function ensureProvisioned(db: ReturnType<typeof createClient>) {
  const now = new Date().toISOString();
  await db.auth.admin.updateUserById(HOLDER.userId, {
    email_confirm: true,
    app_metadata: { role: 'program_holder' },
  });
  await db.from('profiles').upsert(
    {
      id: HOLDER.userId,
      email: HOLDER.email,
      full_name: HOLDER.contactName,
      role: 'program_holder',
      program_holder_id: HOLDER.holderId,
      phone: HOLDER.phone,
      address: HOLDER.addressLine1,
      city: HOLDER.city,
      state: HOLDER.state,
      zip: HOLDER.zip,
      updated_at: now,
    },
    { onConflict: 'id' },
  );
  await db
    .from('program_holders')
    .update({
      status: 'approved',
      approved_at: now,
      contact_email: HOLDER.email,
      contact_phone: HOLDER.phone,
      updated_at: now,
    })
    .eq('id', HOLDER.holderId);
  for (const prog of PROGRAM_LINKS) {
    await db.from('program_holder_programs').upsert(
      { program_holder_id: HOLDER.holderId, program_id: prog.id, status: 'active' },
      { onConflict: 'program_holder_id,program_id' },
    );
  }
  console.log('  ✅ Program holder provision confirmed');
}

async function main() {
  assertOutreachEmailAllowed('send-enchanted-hearts-mou-package.ts');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) process.exit(1);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const sgKey = await loadSendGridKey(db);
  if (!sgKey) {
    console.error('SENDGRID_API_KEY not found');
    process.exit(1);
  }

  console.log(`\n=== ${HOLDER.organizationName} — complete MOU package ===`);
  await ensureProvisioned(db);

  const signedAt = new Date().toISOString();
  const common = {
    organization_name: HOLDER.organizationName,
    signer_name: HOLDER.contactName,
    signer_title: HOLDER.signerTitle,
    contact_email: HOLDER.email,
    contact_phone: HOLDER.phone,
    partner_address: `${HOLDER.addressLine1}, ${HOLDER.city}, ${HOLDER.state} ${HOLDER.zip}`,
    partner_ein: HOLDER.ein,
    signed_at: signedAt,
    payout_share_pct: 33.33,
  };

  const part1 = await generateProgramHolderWorkforceMOUPdf({
    ...common,
    programs: PROGRAMS,
    regulatory_approvals: [
      'Indiana Nurse Aide Training Program (105-hour)',
      'Qualified Medication Aide (QMA) Training Program',
      'Approved clinical/practicum sites as listed with IDOH/ISDH',
    ],
    mou_version: '2026-workforce-part1-master',
  });

  const part2 = await generateProgramHolderMOUPart2Pdf({
    organization_name: HOLDER.organizationName,
    signer_name: HOLDER.contactName,
    contact_email: HOLDER.email,
    payout_share_pct: 33.33,
    signed_at: signedAt,
    mou_version: '2026-workforce-part2-payments',
  });

  console.log(`  📄 Part 1: ${Math.round(part1.length / 1024)} KB`);
  console.log(`  📄 Part 2: ${Math.round(part2.length / 1024)} KB`);

  const { steps } = await buildJourneyLinks(db, HOLDER.email, 'program_holder');
  const stepsHtml = journeyStepsHtml(steps, { primaryIndex: 0 });
  const orgSlug = HOLDER.organizationName.replace(/[^a-zA-Z0-9]+/g, '-');

  const mouHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#1e293b;padding:24px 32px">
<p style="margin:0;color:#fff;font-size:18px;font-weight:700">${PLATFORM_DEFAULTS.orgName}</p>
<p style="margin:6px 0 0;color:#94a3b8;font-size:13px">Program Holder Agreement — Complete Package</p>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;font-size:15px">Dear Shawndra,</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
We apologize for the confusion caused by our earlier MOU emails. Please <strong>disregard and delete all previous MOU attachments</strong> we sent — they are superseded by this message.
</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
Attached is the <strong>complete, correct Program Holder workforce training agreement</strong> for <strong>${HOLDER.organizationName}</strong>, in two parts:
</p>
<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.8;color:#475569">
<li><strong>Part 1 — Master Workforce Training MOU</strong> (programs, roles, compliance, signatures)</li>
<li><strong>Part 2 — Payment, Refund &amp; Reporting Addendum</strong> (what you are entitled to, refund policy, reporting requirements, audits)</li>
</ol>
<p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#475569">
Please review both PDFs, then complete these steps <strong>in order</strong> (log in with <strong>${HOLDER.email}</strong>):
</p>
${stepsHtml}
<p style="margin:0;font-size:13px;color:#475569">Questions? Reply to this email or call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>.</p>
<p style="margin:24px 0 0;font-size:14px">Warm regards,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO, ${PLATFORM_DEFAULTS.orgName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  await sendMail(sgKey, {
    to: HOLDER.email,
    subject: `Please Disregard Prior MOU — Complete Program Holder Agreement (Part 1 + Part 2) — ${HOLDER.organizationName}`,
    html: mouHtml,
    attachments: [
      {
        content: Buffer.from(part1).toString('base64'),
        filename: `Elevate-MOU-Part-1-Master-Agreement-${orgSlug}.pdf`,
      },
      {
        content: Buffer.from(part2).toString('base64'),
        filename: `Elevate-MOU-Part-2-Payment-Refund-Reporting-${orgSlug}.pdf`,
      },
    ],
  });
  console.log('  ✅ Complete MOU package sent (Part 1 + Part 2, CC Elevate)');

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
