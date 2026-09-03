#!/usr/bin/env node
/**
 * DEPRECATED — do not send dashboard emails from ops scripts.
 * Use MOU-only scripts (provision-barber-host-send-mou.ts, provision-enchanted-hearts --mou-only).
 *
 * This script is blocked unless ALLOW_DASHBOARD_OUTREACH=1 is set explicitly.
 */
if (process.env.ALLOW_DASHBOARD_OUTREACH !== '1') {
  console.error(
    'Blocked: dashboard outreach emails are disabled. Set ALLOW_DASHBOARD_OUTREACH=1 to override.',
  );
  process.exit(1);
}
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org').replace(
  /\/$/,
  '',
);
const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';
const now = new Date().toISOString();

const CORIENNE = {
  userId: 'f7eda882-1c42-4109-bfbb-d833b10e7fb3',
  partnerId: '65cdd03c-6b33-4861-8669-92582d5642f1',
  email: 'styleandscissorsalon@gmail.com',
  name: 'Corienne Meid',
  shopName: 'Style and Scissors Salon',
};

const AARON = {
  userId: '17326f0e-4c74-45d9-b024-51fe0aeef19e',
  partnerId: 'deedb623-7acf-4963-a54e-ffa86e8e6d6c',
  email: 'razorsimage11@gmail.com',
  name: 'Aaron Brown',
  shopName: 'Razors Image Barbershop',
  supervisorLicense: 'BA11400162',
  shopLicense: 'BS31100487',
  address: '155 S Kingston Dr',
  city: 'Bloomington',
  state: 'IN',
  zip: '47403',
};

const corienneOnly = process.argv.includes('--corienne-only');
const aaronOnly = process.argv.includes('--aaron-only');

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

async function loadSendGridKey() {
  if (process.env.SENDGRID_API_KEY) return process.env.SENDGRID_API_KEY;
  const { data } = await db.from('platform_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  if (data?.value) return data.value;
  const { data: app } = await db.from('app_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  return app?.value ?? null;
}

async function sendMail(apiKey, { to, subject, html, attachments }) {
  const payload = {
    personalizations: [
      {
        to: [{ email: to }],
        cc: [{ email: ELEVATE_COPY, name: 'Elevate Admin Copy' }],
      },
    ],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
    reply_to: { email: ELEVATE_COPY, name: 'Elizabeth Greene' },
    subject,
    content: [{ type: 'text/html', value: html }],
  };
  if (attachments?.length) payload.attachments = attachments;

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status !== 202) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
}

async function linkPartnerUser(partnerId, userId) {
  const { error } = await db.from('partner_users').upsert(
    { partner_id: partnerId, user_id: userId, role: 'owner', status: 'active' },
    { onConflict: 'partner_id,user_id' },
  );
  if (error) throw error;
}

async function ensurePartnerAccount(host, extra = {}) {
  await db.auth.admin.updateUserById(host.userId, { email_confirm: true });
  await db
    .from('profiles')
    .update({
      role: 'partner',
      full_name: host.name,
      onboarding_completed: true,
      updated_at: now,
    })
    .eq('id', host.userId);
  await linkPartnerUser(host.partnerId, host.userId);
  const { error } = await db
    .from('partners')
    .update({
      approval_status: 'approved',
      status: 'active',
      approved_at: now,
      onboarding_completed: true,
      documents_verified: true,
      is_active: true,
      updated_at: now,
      ...extra,
    })
    .eq('id', host.partnerId);
  if (error) throw error;
  console.log(`  ✅ Partner dashboard provisioned for ${host.email}`);
}

async function magicLink(email, redirectPath) {
  const { data, error } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${SITE_URL}/auth/callback?redirect=${encodeURIComponent(redirectPath)}` },
  });
  if (error) throw error;
  return data.properties?.action_link ?? null;
}

async function provisionCorienne(apiKey) {
  console.log('\n=== Corienne Meid — Style and Scissors ===');
  await ensurePartnerAccount(CORIENNE, {
    programs: ['cosmetology', 'barber', 'nail_technician'],
    partner_type: 'salon',
    program_type: 'cosmetology',
  });

  const loginUrl = await magicLink(CORIENNE.email, '/partner/dashboard');
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1e293b;max-width:600px;margin:0 auto">
<p>Hi Corienne,</p>
<p>Your <strong>host shop partner dashboard</strong> for <strong>${CORIENNE.shopName}</strong> is now active.</p>
<p>Use this secure link to log in (no password needed):</p>
<p><a href="${loginUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">Open Host Partner Dashboard →</a></p>
<p style="font-size:14px;color:#475569">Or sign in at <a href="${SITE_URL}/login">${SITE_URL}/login</a> with <strong>${CORIENNE.email}</strong>, then go to <strong>Partner Dashboard</strong>.</p>
<p style="font-size:14px;color:#475569">From the dashboard you can track apprentices, verify hours, and manage host shop documents. If you still have unsigned program MOUs (barber or nail), use the separate MOU emails we sent — not the dashboard — to sign those first.</p>
<p>Questions? Reply to this email or call (317) 314-3757.</p>
<p>Thank you,<br><strong>Elizabeth Greene</strong><br>Elevate for Humanity</p>
</body></html>`;

  await sendMail(apiKey, {
    to: CORIENNE.email,
    subject: `Your host partner dashboard is ready — ${CORIENNE.shopName}`,
    html,
  });
  console.log(`  ✅ Dashboard login email sent (magic link)`);
}

async function provisionAaron(apiKey) {
  console.log('\n=== Aaron Brown — Razors Image Barbershop ===');
  await ensurePartnerAccount(AARON, {
    programs: ['barber'],
    partner_type: 'barber',
    program_type: 'barber',
    mou_signed: false,
    onboarding_completed: false,
    license_number: AARON.shopLicense,
    supervisor_license_number: AARON.supervisorLicense,
    address_line1: AARON.address,
    city: AARON.city,
    state: AARON.state,
    zip: AARON.zip,
  });

  await db
    .from('barbershop_partner_applications')
    .update({ status: 'approved', updated_at: now })
    .eq('contact_email', AARON.email);

  // PDF generation requires TypeScript — use: pnpm tsx scripts/ops/send-aaron-barber-mou.ts
  const { spawnSync } = await import('child_process');
  const child = spawnSync(
    'pnpm',
    ['tsx', '--env-file=.env.local', 'scripts/ops/send-aaron-barber-mou.ts'],
    { cwd: ROOT, stdio: 'inherit', env: process.env },
  );
  if (child.status !== 0) {
    throw new Error('send-aaron-barber-mou.ts failed — run it manually');
  }
  console.log(`  ✅ Barber MOU email sent with PDF attachment`);
}

async function main() {
  const apiKey = await loadSendGridKey();
  if (!apiKey) {
    console.error('SENDGRID_API_KEY not found');
    process.exit(1);
  }

  if (!aaronOnly) await provisionCorienne(apiKey);
  if (!corienneOnly) await provisionAaron(apiKey);
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
