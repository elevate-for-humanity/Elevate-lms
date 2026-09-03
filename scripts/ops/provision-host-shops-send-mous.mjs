#!/usr/bin/env node
/**
 * Provision host shop partner records + send MOU emails (no dashboard links).
 *
 *   node scripts/ops/provision-host-shops-send-mous.mjs
 *   node scripts/ops/provision-host-shops-send-mous.mjs --dry-run
 *   node scripts/ops/provision-host-shops-send-mous.mjs --provision-only
 *   node scripts/ops/provision-host-shops-send-mous.mjs --email-only
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const PRODUCTION_SITE_URL = 'https://www.elevateforhumanity.org';
function outboundSiteUrl() {
  const raw = (process.env.OUTBOUND_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL).replace(
    /\/$/,
    '',
  );
  if (/localhost|127\.0\.0\.1/i.test(raw)) {
    console.warn(`⚠️ Outbound links use ${PRODUCTION_SITE_URL} (dev SITE_URL ignored)`);
    return PRODUCTION_SITE_URL;
  }
  return raw;
}
const SITE_URL = outboundSiteUrl();
const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';
const FROM = { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' };
const REPLY_TO = { email: ELEVATE_COPY, name: 'Elizabeth Greene' };

const DRY_RUN = process.argv.includes('--dry-run');
const PROVISION_ONLY = process.argv.includes('--provision-only');
const EMAIL_ONLY = process.argv.includes('--email-only');

function loadEnvLocal() {
  const p = join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key === 'placeholder') {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const now = new Date().toISOString();

const STYLE_AND_SCISSORS = {
  key: 'style-and-scissors',
  shopName: 'Style and Scissors Salon',
  contactName: 'Corienne Meid',
  email: 'styleandscissorsalon@gmail.com',
  userId: 'f7eda882-1c42-4109-bfbb-d833b10e7fb3',
  partnerId: '65cdd03c-6b33-4861-8669-92582d5642f1',
  programs: [
    {
      label: 'Cosmetology Apprenticeship',
      signPath: '/partners/cosmetology-host-shop/sign-mou',
      status: 'signed',
    },
    {
      label: 'Barber Apprenticeship',
      signPath: '/partners/barber-host-shop/sign-mou',
      status: 'pending',
    },
    {
      label: 'Nail Technician Apprenticeship',
      signPath: '/partners/nail-technician-apprenticeship/sign-mou',
      status: 'pending',
    },
  ],
};

const RAZORS_IMAGE = {
  key: 'razors-image',
  shopName: 'Razors Image Barbershop',
  contactName: 'Aaron Brown',
  email: 'razorsimage11@gmail.com',
  userId: '17326f0e-4c74-45d9-b024-51fe0aeef19e',
  phone: '317-000-0000',
  shopLegalName: 'Razors Image Barbershop',
  ownerName: 'Aaron Brown',
  address: '155 S Kingston Dr',
  city: 'Bloomington',
  state: 'IN',
  zip: '47403',
  shopLicense: 'BS31100487',
  supervisorLicense: 'BA11400162',
  ein: '82-4312433',
  programs: [
    {
      label: 'Barber Apprenticeship',
      signPath: '/partners/barber-host-shop/sign-mou',
      status: 'pending',
    },
  ],
};

async function loadSendGridKey() {
  if (process.env.SENDGRID_API_KEY) return process.env.SENDGRID_API_KEY;
  const { data } = await db
    .from('platform_secrets')
    .select('value')
    .eq('key', 'SENDGRID_API_KEY')
    .maybeSingle();
  if (data?.value) return data.value;
  const { data: app } = await db
    .from('app_secrets')
    .select('value')
    .eq('key', 'SENDGRID_API_KEY')
    .maybeSingle();
  return app?.value ?? null;
}

async function sendEmail({ to, subject, html }) {
  const sgKey = await loadSendGridKey();
  if (!sgKey) throw new Error('SENDGRID_API_KEY not found');
  const payload = {
    personalizations: [
      {
        to: [{ email: to }],
        cc: [{ email: ELEVATE_COPY, name: 'Elevate Admin Copy' }],
      },
    ],
    from: FROM,
    reply_to: REPLY_TO,
    subject,
    content: [{ type: 'text/html', value: html }],
  };
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would email ${to} — ${subject}`);
    return;
  }
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sgKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (res.status !== 202) {
    const body = await res.text();
    throw new Error(`SendGrid ${res.status}: ${body}`);
  }
  console.log(`  ✅ Email sent to ${to} (CC: ${ELEVATE_COPY})`);
}

function buildMouEmail(host) {
  const firstName = host.contactName.split(' ')[0];
  const programRows = host.programs
    .map((p) => {
      const link = `${SITE_URL}/login?redirect=${encodeURIComponent(p.signPath)}`;
      const badge =
        p.status === 'signed'
          ? '<span style="color:#166534;font-weight:bold">✓ Signed</span>'
          : `<a href="${link}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:bold">Sign MOU →</a>`;
      return `<tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b">${p.label}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right">${badge}</td>
      </tr>`;
    })
    .join('');

  const pendingCount = host.programs.filter((p) => p.status !== 'signed').length;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
  <tr><td style="background:#1e293b;padding:28px 32px">
    <p style="margin:0;color:#fff;font-size:20px;font-weight:700">Elevate for Humanity</p>
    <p style="margin:6px 0 0;color:#94a3b8;font-size:13px">Host Shop Partnership — Memorandum of Understanding</p>
  </td></tr>
  <tr><td style="padding:32px">
    <p style="margin:0 0 16px;color:#1e293b;font-size:15px">Hi ${firstName},</p>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.7">
      Thank you for partnering with <strong>Elevate for Humanity</strong> as a registered apprenticeship host shop for
      <strong>${host.shopName}</strong>. Below are your program MOU(s) for review and signature.
    </p>
    <p style="margin:0 0 12px;color:#1e293b;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em">Program MOUs</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:0 0 24px">
      ${programRows}
    </table>
    ${
      pendingCount > 0
        ? `<p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.7">
      Please sign the ${pendingCount === 1 ? 'remaining MOU' : 'remaining MOUs'} using the buttons above (you will be prompted to log in with <strong>${host.email}</strong>).
    </p>`
        : `<p style="margin:0 0 20px;color:#166534;font-size:14px">All program MOUs for your shop are on file. Reply to this email if you need anything else.</p>`
    }
    <p style="margin:0 0 8px;color:#475569;font-size:13px">Questions? Reply to this email or call <strong>(317) 314-3757</strong>.</p>
    <p style="margin:24px 0 0;color:#1e293b;font-size:14px">
      Warm regards,<br><strong>Elizabeth Greene</strong><br>Founder &amp; CEO, Elevate for Humanity
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

async function linkPartnerUser(partnerId, userId) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would link partner_users ${partnerId} ↔ ${userId}`);
    return;
  }
  const { error } = await db.from('partner_users').upsert(
    { partner_id: partnerId, user_id: userId, role: 'owner', status: 'active' },
    { onConflict: 'partner_id,user_id' },
  );
  if (error) throw new Error(`partner_users: ${error.message}`);
  console.log('  ✅ partner_users linked');
}

async function setPartnerRole(userId) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would set profile role=partner for ${userId}`);
    return;
  }
  await db
    .from('profiles')
    .update({ role: 'partner', updated_at: now })
    .eq('id', userId)
    .neq('role', 'admin')
    .neq('role', 'super_admin');
  console.log('  ✅ profile role → partner');
}

async function provisionStyleAndScissors() {
  console.log('\n=== Style and Scissors Salon ===');
  const h = STYLE_AND_SCISSORS;

  if (!EMAIL_ONLY) {
    const partnerPatch = {
      approval_status: 'approved',
      status: 'active',
      approved_at: now,
      programs: ['cosmetology', 'barber', 'nail_technician'],
      onboarding_completed: true,
      updated_at: now,
    };
    if (DRY_RUN) {
      console.log('  [DRY RUN] Would update partner', partnerPatch);
    } else {
      const { error } = await db.from('partners').update(partnerPatch).eq('id', h.partnerId);
      if (error) throw new Error(`partner update: ${error.message}`);
      console.log('  ✅ partner approved + programs set');
    }

    await linkPartnerUser(h.partnerId, h.userId);
    await setPartnerRole(h.userId);

    const { data: existingBarber } = await db
      .from('barbershop_partner_applications')
      .select('id')
      .eq('contact_email', h.email)
      .maybeSingle();

    if (!existingBarber) {
      const barberRow = {
        shop_legal_name: h.shopName,
        owner_name: h.contactName,
        contact_name: h.contactName,
        contact_email: h.email,
        contact_phone: '8126910730',
        shop_address_line1: '10 E Washington St',
        shop_city: 'Sullivan',
        shop_state: 'IN',
        shop_zip: '47882',
        indiana_shop_license_number: 'BS92400367',
        supervisor_name: h.contactName,
        supervisor_license_number: 'BC20101024',
        supervisor_years_licensed: 25,
        compensation_model: 'hourly',
        employment_model: 'hourly',
        has_workers_comp: false,
        workers_comp_status: 'none',
        can_supervise_and_verify: true,
        mou_acknowledged: true,
        consent_acknowledged: true,
        status: 'approved',
        notes: 'Provisioned via provision-host-shops-send-mous.mjs — barber track for multi-program salon',
      };
      if (DRY_RUN) {
        console.log('  [DRY RUN] Would insert barbershop_partner_applications', barberRow);
      } else {
        const { error } = await db.from('barbershop_partner_applications').insert(barberRow);
        if (error) throw new Error(`barber app: ${error.message}`);
        console.log('  ✅ barbershop_partner_applications created (barber track)');
      }
    } else {
      console.log('  ℹ barbershop application already exists');
    }
  }

  if (!PROVISION_ONLY) {
    await sendEmail({
      to: h.email,
      subject: `Host Shop MOUs — ${h.shopName}`,
      html: buildMouEmail(h),
    });
  }
}

async function provisionRazorsImage() {
  console.log('\n=== Razors Image Barbershop ===');
  const h = RAZORS_IMAGE;
  let partnerId;

  if (!EMAIL_ONLY) {
    const { data: existingPartner } = await db
      .from('partners')
      .select('id')
      .eq('contact_email', h.email)
      .maybeSingle();

    partnerId = existingPartner?.id;

    const partnerPayload = {
      name: h.shopLegalName,
      legal_name: h.shopLegalName,
      shop_name: h.shopLegalName,
      owner_name: h.ownerName,
      contact_name: h.contactName,
      contact_email: h.email,
      contact_phone: h.phone,
      address_line1: h.address,
      city: h.city,
      state: h.state,
      zip: h.zip,
      license_number: h.shopLicense,
      supervisor_name: h.contactName,
      supervisor_license_number: h.supervisorLicense,
      partner_type: 'barber',
      program_type: 'barber',
      approval_status: 'approved',
      status: 'active',
      approved_at: now,
      onboarding_completed: false,
      mou_signed: false,
      can_supervise_and_verify: true,
      compensation_model: 'hourly',
      workers_comp_status: 'none',
      programs: ['barber'],
      notes: `EIN ${h.ein} — provisioned via provision-host-shops-send-mous.mjs`,
      updated_at: now,
    };

    if (partnerId) {
      if (DRY_RUN) {
        console.log('  [DRY RUN] Would update partner', partnerId);
      } else {
        const { error } = await db.from('partners').update(partnerPayload).eq('id', partnerId);
        if (error) throw new Error(`partner update: ${error.message}`);
        console.log('  ✅ partner updated');
      }
    } else if (DRY_RUN) {
      console.log('  [DRY RUN] Would insert barber partner');
      partnerId = 'dry-run-partner-id';
    } else {
      const { data: inserted, error } = await db
        .from('partners')
        .insert({ ...partnerPayload, applied_at: now })
        .select('id')
        .single();
      if (error) throw new Error(`partner insert: ${error.message}`);
      partnerId = inserted.id;
      console.log('  ✅ partner created', partnerId);
    }

    const { data: existingBarber } = await db
      .from('barbershop_partner_applications')
      .select('id')
      .eq('contact_email', h.email)
      .maybeSingle();

    if (!existingBarber) {
      const barberRow = {
        shop_legal_name: h.shopLegalName,
        owner_name: h.ownerName,
        contact_name: h.contactName,
        contact_email: h.email,
        contact_phone: h.phone,
        shop_address_line1: h.address,
        shop_city: h.city,
        shop_state: h.state,
        shop_zip: h.zip,
        indiana_shop_license_number: h.shopLicense,
        supervisor_name: h.contactName,
        supervisor_license_number: h.supervisorLicense,
        ein: h.ein,
        compensation_model: 'hourly',
        employment_model: 'hourly',
        has_workers_comp: false,
        workers_comp_status: 'none',
        can_supervise_and_verify: true,
        mou_acknowledged: true,
        consent_acknowledged: true,
        status: 'approved',
        notes: 'Provisioned via provision-host-shops-send-mous.mjs',
      };
      if (DRY_RUN) {
        console.log('  [DRY RUN] Would insert barbershop_partner_applications');
      } else {
        const { error } = await db.from('barbershop_partner_applications').insert(barberRow);
        if (error) throw new Error(`barber app: ${error.message}`);
        console.log('  ✅ barbershop_partner_applications created');
      }
    } else {
      if (!DRY_RUN) {
        await db
          .from('barbershop_partner_applications')
          .update({ status: 'approved', updated_at: now })
          .eq('id', existingBarber.id);
      }
      console.log('  ℹ barbershop application updated/exists');
    }

    await linkPartnerUser(partnerId, h.userId);
    await setPartnerRole(h.userId);

    if (!DRY_RUN) {
      await db.auth.admin.updateUserById(h.userId, { email_confirm: true });
    }
  }

  if (!PROVISION_ONLY) {
    await sendEmail({
      to: h.email,
      subject: `Barber Host Shop MOU — ${h.shopName}`,
      html: buildMouEmail(h),
    });
  }
}

async function verify() {
  console.log('\n=== Verification ===');
  for (const email of [STYLE_AND_SCISSORS.email, RAZORS_IMAGE.email]) {
    const { data: profile } = await db.from('profiles').select('role').ilike('email', email).maybeSingle();
    const { data: pu } = await db
      .from('partner_users')
      .select('partner_id, status, partners(approval_status, mou_signed, programs)')
      .eq('user_id', profile?.id ? (await db.from('profiles').select('id').ilike('email', email).single()).data?.id : '')
      .maybeSingle();
    // simpler query
    const { data: prof } = await db.from('profiles').select('id, role').ilike('email', email).maybeSingle();
    const { data: link } = await db
      .from('partner_users')
      .select('partner_id, status')
      .eq('user_id', prof?.id ?? '')
      .maybeSingle();
    const { data: partner } = link
      ? await db
          .from('partners')
          .select('approval_status, mou_signed, programs, program_type')
          .eq('id', link.partner_id)
          .maybeSingle()
      : { data: null };
    const { data: bpa } = await db
      .from('barbershop_partner_applications')
      .select('status, mou_signed_at')
      .ilike('contact_email', email)
      .maybeSingle();
    console.log(email);
    console.log('  role:', prof?.role, '| partner_users:', link ? 'yes' : 'NO', '| approved:', partner?.approval_status);
    console.log('  programs:', partner?.programs, '| barber app:', bpa?.status);
  }
}

console.log(DRY_RUN ? 'DRY RUN' : PROVISION_ONLY ? 'PROVISION ONLY' : EMAIL_ONLY ? 'EMAIL ONLY' : 'LIVE');

try {
  await provisionStyleAndScissors();
  await provisionRazorsImage();
  if (!DRY_RUN) await verify();
  console.log('\nDone.');
} catch (err) {
  console.error('Failed:', err);
  process.exit(1);
}
