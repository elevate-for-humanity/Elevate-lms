#!/usr/bin/env tsx
/**
 * Provision Enchanted Hearts Training Institute LLC as a third-party program holder,
 * send MOU PDF only (no dashboard emails — provision DB access separately if needed).
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/provision-enchanted-hearts-program-holder.ts
 *   pnpm tsx --env-file=.env.local scripts/ops/provision-enchanted-hearts-program-holder.ts --dry-run
 */
import { randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { generateDetailedMOUPdf } from '@/lib/documents/generate-detailed-mou-pdf';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { outboundSiteUrl } from './outbound-site-url';
import { buildJourneyLinks, journeyStepsHtml } from './outreach-auth-link';
import { assertOutreachEmailAllowed } from './outreach-email-guard';

const SITE_URL = outboundSiteUrl();
const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';
const DRY_RUN = process.argv.includes('--dry-run');
const MOU_ONLY = process.argv.includes('--mou-only');

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
  website: 'https://www.enchantedheartstraining.com',
};

/** Live program IDs in Elevate `programs` catalog */
const PROGRAM_LINKS = [
  { id: 'fb36dbf1-db3c-4d34-adf9-3f98f397d371', slug: 'cna' },
  { id: 'd8f45366-1838-4539-ae32-7bc985773772', slug: 'home-health-aide' },
];

const MOU_PROGRAMS = [
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
  opts: { to: string; subject: string; html: string; pdfB64?: string; filename?: string },
) {
  const payload: Record<string, unknown> = {
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
  };
  if (opts.pdfB64 && opts.filename) {
    payload.attachments = [
      {
        content: opts.pdfB64,
        type: 'application/pdf',
        filename: opts.filename,
        disposition: 'attachment',
      },
    ];
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] ${opts.subject} → ${opts.to}`);
    return;
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status !== 202) {
    throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
  }
}

function mouEmailHtml(stepsHtml: string) {
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
for <strong>${HOLDER.organizationName}</strong>.
</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
<strong>Attached:</strong> your <strong>Program Holder Memorandum of Understanding (MOU)</strong> covering CNA, HHA, QMA,
and related healthcare training programs delivered through your institute.
</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#475569">Review the attached PDF, then complete these steps <strong>in order</strong> (each link signs you in and opens the correct page on ${SITE_URL}):</p>
${stepsHtml}
<p style="margin:0;font-size:13px;color:#475569">Questions? Reply here or call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>.</p>
<p style="margin:24px 0 0;font-size:14px">Warm regards,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO, ${PLATFORM_DEFAULTS.orgName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function buildMouPdf() {
  return generateDetailedMOUPdf({
    partner_name: HOLDER.organizationName,
    partner_role: `Third-Party Program Delivery Partner',
    signer_name: HOLDER.contactName,
    signer_title: HOLDER.signerTitle,
    contact_email: HOLDER.email,
    contact_phone: HOLDER.phone,
    partner_address: `${HOLDER.addressLine1}, ${HOLDER.city}, ${HOLDER.state} ${HOLDER.zip}`,
    partner_ein: HOLDER.ein,
    programs: MOU_PROGRAMS,
    revenue_share_model:
      'Program delivery partner delivers ISDH-aligned healthcare training; Elevate provides ETPL listing, WIOA/DOL sponsorship pathways, enrollment infrastructure, and compliance oversight per executed agreement.',
    wioa_eligible: true,
    signed_at: new Date().toISOString(),
    mou_version: '2026-program-holder-healthcare-01',
  });
}

async function sendCorrectedMou(sgKey: string, db: ReturnType<typeof createClient>) {
  const pdfBytes = await buildMouPdf();
  const pdfB64 = Buffer.from(pdfBytes).toString('base64');
  const pdfFilename = `Elevate-Program-Holder-MOU-${HOLDER.organizationName.replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`;
  const { steps } = await buildJourneyLinks(db, HOLDER.email, 'program_holder');
  const stepsHtml = journeyStepsHtml(steps, { primaryIndex: 0 });
  const html = mouEmailHtml(stepsHtml);
  await sendMail(sgKey, {
    to: HOLDER.email,
    subject: `Corrected Program Holder MOU — ${HOLDER.organizationName}`,
    html,
    pdfB64,
    filename: pdfFilename,
  });
  console.log(`  ✅ Corrected MOU sent (${Math.round(pdfBytes.length / 1024)} KB)`);
}

async function main() {
  assertOutreachEmailAllowed('provision-enchanted-hearts-program-holder.ts');

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

  const now = new Date().toISOString();
  console.log(`\n=== ${HOLDER.organizationName} ===`);

  if (MOU_ONLY) {
    const sgKeyOnly = await loadSendGridKey(db);
    if (!sgKeyOnly && !DRY_RUN) {
      console.error('SENDGRID_API_KEY not found');
      process.exit(1);
    }
    await sendCorrectedMou(sgKeyOnly!, db);
    console.log('\nDone (MOU resend only).');
    return;
  }

  // ── Auth user ─────────────────────────────────────────────────────────────
  let userId: string | null = null;
  const { data: existingProfile } = await db
    .from('profiles')
    .select('id')
    .eq('email', HOLDER.email)
    .maybeSingle();

  if (existingProfile?.id) {
    userId = existingProfile.id;
    console.log('  ℹ Existing profile', userId);
  } else if (!DRY_RUN) {
    const tempPassword = randomBytes(18).toString('base64url');
    const { data: created, error } = await db.auth.admin.createUser({
      email: HOLDER.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: 'program_holder',
        full_name: HOLDER.contactName,
      },
      app_metadata: { role: 'program_holder' },
    });
    if (created?.user?.id) {
      userId = created.user.id;
      console.log('  ✅ Auth user created', userId);
    } else if (error) {
      const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = listed?.users?.find((u) => u.email?.toLowerCase() === HOLDER.email);
      if (!found) throw new Error(`Auth create failed: ${error.message}`);
      userId = found.id;
      await db.auth.admin.updateUserById(userId, {
        email_confirm: true,
        app_metadata: { role: 'program_holder' },
      });
      console.log('  ✅ Auth user linked', userId);
    }
  } else {
    userId = 'dry-run-user-id';
    console.log('  [DRY RUN] Would create auth user');
  }

  // ── program_holders row ─────────────────────────────────────────────────
  let holderId: string | null = null;
  const { data: existingHolder } = await db
    .from('program_holders')
    .select('id')
    .eq('organization_name', HOLDER.organizationName)
    .maybeSingle();

  const holderPayload = {
    user_id: userId,
    organization_name: HOLDER.organizationName,
    name: HOLDER.organizationName,
    contact_name: HOLDER.contactName,
    contact_email: HOLDER.email,
    contact_phone: HOLDER.phone,
    status: 'approved',
    approved_at: now,
    mou_signed: false,
    mou_status: 'pending',
    mou_type: 'universal',
    teaches_multiple: true,
    is_using_internal_lms: true,
    payout_status: 'not_started',
    primary_program_id: PROGRAM_LINKS[0]?.id ?? null,
    features: {
      ein: HOLDER.ein,
      address: HOLDER.addressLine1,
      city: HOLDER.city,
      state: HOLDER.state,
      zip: HOLDER.zip,
      website: HOLDER.website,
      idoh_approvals: ['CNA Nurse Aide Training', 'QMA Training Program'],
      notes: 'Third-party program delivery partner — provisioned via ops script',
    },
  };

  if (existingHolder?.id) {
    holderId = existingHolder.id;
    if (!DRY_RUN) {
      const { error } = await db.from('program_holders').update(holderPayload).eq('id', holderId);
      if (error) throw new Error(`program_holders update: ${error.message}`);
    }
    console.log('  ✅ program_holders updated', holderId);
  } else if (!DRY_RUN) {
    const { data: inserted, error } = await db
      .from('program_holders')
      .insert(holderPayload)
      .select('id')
      .single();
    if (error) throw new Error(`program_holders insert: ${error.message}`);
    holderId = inserted.id;
    console.log('  ✅ program_holders created', holderId);
  } else {
    holderId = 'dry-run-holder-id';
    console.log('  [DRY RUN] Would insert program_holders');
  }

  // ── profile ───────────────────────────────────────────────────────────────
  if (!DRY_RUN && userId && holderId) {
    const { error } = await db.from('profiles').upsert(
      {
        id: userId,
        email: HOLDER.email,
        full_name: HOLDER.contactName,
        role: 'program_holder',
        program_holder_id: holderId,
        phone: HOLDER.phone,
        address: HOLDER.addressLine1,
        city: HOLDER.city,
        state: HOLDER.state,
        zip: HOLDER.zip,
        onboarding_completed: false,
        updated_at: now,
      },
      { onConflict: 'id' },
    );
    if (error) throw new Error(`profiles upsert: ${error.message}`);
    await db.auth.admin.updateUserById(userId, { app_metadata: { role: 'program_holder' } });
    console.log('  ✅ profile → program_holder');
  }

  // ── program_holder_programs ─────────────────────────────────────────────────
  if (!DRY_RUN && holderId) {
    for (const prog of PROGRAM_LINKS) {
      const { error } = await db.from('program_holder_programs').upsert(
        {
          program_holder_id: holderId,
          program_id: prog.id,
          status: 'active',
        },
        { onConflict: 'program_holder_id,program_id' },
      );
      if (error) console.warn(`  ⚠ program link ${prog.slug}:`, error.message);
      else console.log(`  ✅ linked program ${prog.slug}`);
    }
  }

  // ── MOU PDF ───────────────────────────────────────────────────────────────
  const pdfBytes = await buildMouPdf();
  const pdfB64 = Buffer.from(pdfBytes).toString('base64');
  const pdfFilename = `Elevate-Program-Holder-MOU-${HOLDER.organizationName.replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`;
  console.log(`  📄 MOU PDF ${Math.round(pdfBytes.length / 1024)} KB`);

  const { steps } = await buildJourneyLinks(db, HOLDER.email, 'program_holder');
  const stepsHtml = journeyStepsHtml(steps, { primaryIndex: 0 });
  await sendMail(sgKey!, {
    to: HOLDER.email,
    subject: `Program Holder MOU — ${HOLDER.organizationName} (signature required)`,
    html: mouEmailHtml(stepsHtml),
    pdfB64,
    filename: pdfFilename,
  });
  console.log('  ✅ MOU email sent (PDF attached, CC Elevate)');

  console.log('\nDone.');
  console.log(`  Email: ${HOLDER.email}`);
  console.log(`  Phone: ${HOLDER.phone}`);
  console.log(`  EIN:   ${HOLDER.ein}`);
  if (holderId) console.log(`  Holder ID: ${holderId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
