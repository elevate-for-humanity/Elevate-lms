#!/usr/bin/env tsx
/**
 * Approve a barber host shop application, provision partner login, send MOU PDF
 * + required document checklist (ask to resend missing uploads).
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/provision-barber-host-send-mou.ts --email calvincutz1985@gmail.com
 *   pnpm tsx --env-file=.env.local scripts/ops/provision-barber-host-send-mou.ts --email christopherd.newkirk@gmail.com --dry-run
 */
import { randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { generateMOUPdf } from '@/lib/documents/generate-mou-pdf';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { outboundSiteUrl } from './outbound-site-url';
import { buildJourneyLinks, journeyStepsHtml } from './outreach-auth-link';
import { assertOutreachEmailAllowed } from './outreach-email-guard';

const SITE_URL = outboundSiteUrl();
const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';
const DRY_RUN = process.argv.includes('--dry-run');
const emailArg = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1]
  ?? process.argv[process.argv.indexOf('--email') + 1];

const REQUIRED_DOCS = [
  'IRS EIN Assignment Letter (CP 575 or 147C)',
  'W-9 Form (signed)',
  'Indiana Barbershop License (current, full copy)',
  "Workers' Compensation Certificate of Insurance",
  'General Liability Insurance Certificate',
  'Supervising Barber License (2+ years experience)',
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

function documentChecklistHtml() {
  const items = REQUIRED_DOCS.map(
    (d) => `<li style="margin-bottom:8px">${d}</li>`,
  ).join('');
  return `
<p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#475569">
<strong>Required documents</strong> — please reply to this email with clear, complete copies (PDF preferred). If we already received a file that was cropped, expired, or unreadable, <strong>resend the full document</strong> as attachments.
</p>
<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7;color:#475569">${items}</ol>`;
}

function buildEmailHtml(opts: {
  firstName: string;
  shopName: string;
  stepsHtml: string;
}) {
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
<p style="margin:0 0 16px;font-size:15px">Hi ${opts.firstName},</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
Your barber apprenticeship <strong>host shop application</strong> for <strong>${opts.shopName}</strong> is approved on the Elevate platform.
<strong>Attached</strong> is your Barber Host Shop Employer Agreement (MOU) for review and signature.
</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#475569">Review the attached MOU PDF, then complete these steps <strong>in order</strong> on ${SITE_URL}:</p>
${opts.stepsHtml}
${documentChecklistHtml()}
<p style="margin:0;font-size:13px;color:#475569">Questions? Reply to this email or call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong>.</p>
<p style="margin:24px 0 0;font-size:14px">Warm regards,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO, ${PLATFORM_DEFAULTS.orgName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function sendMail(
  sgKey: string,
  opts: { to: string; name: string; subject: string; html: string; pdfB64: string; filename: string },
) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would email ${opts.to} — ${opts.subject}`);
    return;
  }
  const res = await fetch(`https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: opts.to, name: opts.name }],
          cc: [{ email: ELEVATE_COPY, name: 'Elevate Admin Copy' }],
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
    }),
  });
  if (res.status !== 202) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
}

async function main() {
  assertOutreachEmailAllowed('provision-barber-host-send-mou.ts');

  if (!emailArg) {
    console.error('Usage: --email <contact_email>');
    process.exit(1);
  }

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

  const { data: app, error: appErr } = await db
    .from('barbershop_partner_applications')
    .select('*')
    .ilike('contact_email', emailArg)
    .maybeSingle();
  if (appErr || !app) {
    console.error('No barbershop_partner_applications row for', emailArg);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const shopName = app.shop_legal_name;
  const contactName = app.contact_name || app.owner_name;
  const firstName = contactName.split(' ')[0];
  const email = app.contact_email.toLowerCase();

  console.log(`\n=== ${shopName} <${email}> ===`);

  if (!DRY_RUN) {
    await db
      .from('barbershop_partner_applications')
      .update({ status: 'approved', updated_at: now })
      .eq('id', app.id);
    console.log('  ✅ application approved');
  }

  let userId: string | null = null;
  const { data: existingProfile } = await db.from('profiles').select('id, role').eq('email', email).maybeSingle();
  if (existingProfile?.id) {
    userId = existingProfile.id;
    console.log('  ℹ Existing profile', userId);
  } else if (!DRY_RUN) {
    const tempPassword = randomBytes(18).toString('base64url');
    const { data: created, error } = await db.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: 'partner', full_name: contactName },
      app_metadata: { role: 'partner' },
    });
    if (created?.user?.id) {
      userId = created.user.id;
      console.log('  ✅ Auth user created', userId);
    } else if (error) {
      const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 500 });
      const found = listed?.users?.find((u) => u.email?.toLowerCase() === email);
      if (!found) throw new Error(`Auth create failed: ${error.message}`);
      userId = found.id;
      await db.auth.admin.updateUserById(userId, { email_confirm: true, app_metadata: { role: 'partner' } });
      console.log('  ✅ Auth user linked', userId);
    }
  } else {
    userId = 'dry-run-user';
  }

  let partnerId: string | null = null;
  const { data: existingPartner } = await db.from('partners').select('id').eq('contact_email', email).maybeSingle();
  const partnerPayload = {
    name: shopName,
    legal_name: shopName,
    shop_name: shopName,
    owner_name: app.owner_name,
    contact_name: contactName,
    contact_email: email,
    contact_phone: app.contact_phone,
    address_line1: app.shop_address_line1,
    city: app.shop_city,
    state: app.shop_state,
    zip: app.shop_zip,
    license_number: app.indiana_shop_license_number,
    supervisor_name: app.supervisor_name,
    supervisor_license_number: app.supervisor_license_number,
    partner_type: 'barber',
    program_type: 'barber',
    approval_status: 'approved',
    status: 'active',
    approved_at: now,
    onboarding_completed: false,
    mou_signed: Boolean(app.mou_signed_at),
    can_supervise_and_verify: app.can_supervise_and_verify ?? true,
    compensation_model: app.compensation_model || app.employment_model || 'hourly',
    workers_comp_status: app.workers_comp_status || 'none',
    programs: ['barber'],
    notes: `Provisioned via provision-barber-host-send-mou.ts — app ${app.id}`,
    updated_at: now,
  };

  if (existingPartner?.id) {
    partnerId = existingPartner.id;
    if (!DRY_RUN) {
      const { error } = await db.from('partners').update(partnerPayload).eq('id', partnerId);
      if (error) throw new Error(`partner update: ${error.message}`);
    }
    console.log('  ✅ partner updated', partnerId);
  } else if (!DRY_RUN) {
    const { data: inserted, error } = await db
      .from('partners')
      .insert({ ...partnerPayload, applied_at: now })
      .select('id')
      .single();
    if (error) throw new Error(`partner insert: ${error.message}`);
    partnerId = inserted.id;
    console.log('  ✅ partner created', partnerId);
  } else {
    partnerId = 'dry-run-partner';
  }

  if (!DRY_RUN && userId && partnerId) {
    await db.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: contactName,
        role: 'partner',
        phone: app.contact_phone,
        updated_at: now,
      },
      { onConflict: 'id' },
    );
    await db.from('partner_users').upsert(
      { partner_id: partnerId, user_id: userId, role: 'owner', status: 'active' },
      { onConflict: 'partner_id,user_id' },
    );
    await db.auth.admin.updateUserById(userId, { app_metadata: { role: 'partner' } });
    console.log('  ✅ profile + partner_users linked');
  }

  const { steps } = await buildJourneyLinks(db, email, 'partner');
  const stepsHtml = journeyStepsHtml(steps, { primaryIndex: 0 });

  const pdfBytes = await generateMOUPdf({
    shop_name: shopName,
    signer_name: contactName,
    signer_title: 'Owner / Licensed Barber',
    supervisor_name: app.supervisor_name || contactName,
    supervisor_license: app.supervisor_license_number || undefined,
    compensation_model: app.compensation_model || app.employment_model || 'hourly',
    signed_at: new Date().toISOString(),
    mou_version: '2025-barber-01',
  });
  const pdfB64 = Buffer.from(pdfBytes).toString('base64');
  const filename = `Elevate-Barber-Host-MOU-${shopName.replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`;

  await sendMail(sgKey!, {
    to: email,
    name: contactName,
    subject: `Barber Host Shop MOU & required documents — ${shopName}`,
    html: buildEmailHtml({ firstName, shopName, stepsHtml }),
    pdfB64,
    filename,
  });
  console.log(`  ✅ MOU + document checklist emailed (${Math.round(pdfBytes.length / 1024)} KB PDF)`);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
