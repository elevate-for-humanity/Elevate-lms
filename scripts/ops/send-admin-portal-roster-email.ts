#!/usr/bin/env tsx
/**
 * Email Elevate admin a full roster of apprentices + host shops/program holders.
 * Optionally resets portal passwords (existing passwords cannot be read from Supabase).
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/send-admin-portal-roster-email.ts
 *   pnpm tsx --env-file=.env.local scripts/ops/send-admin-portal-roster-email.ts --dry-run
 *   pnpm tsx --env-file=.env.local scripts/ops/send-admin-portal-roster-email.ts --no-reset-passwords
 */
import crypto from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { outboundSiteUrl } from './outbound-site-url';
import { assertOutreachEmailAllowed } from './outreach-email-guard';

const ADMIN = 'elevate4humanityedu@gmail.com';
const SITE_URL = outboundSiteUrl();
const DRY_RUN = process.argv.includes('--dry-run');
const RESET_PASSWORDS = !process.argv.includes('--no-reset-passwords');

function tempPassword(): string {
  return `El${crypto.randomBytes(4).toString('hex').toUpperCase()}#26`;
}

async function loadSendGridKey(db: ReturnType<typeof createClient>) {
  if (process.env.SENDGRID_API_KEY) return process.env.SENDGRID_API_KEY;
  const { data: ps } = await db.from('platform_secrets').select('key, value_enc').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  if (ps?.value_enc) return ps.value_enc as string;
  const { data: app } = await db.from('app_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  return (app?.value as string) ?? null;
}

async function setPassword(db: ReturnType<typeof createClient>, userId: string, password: string) {
  const { error } = await db.auth.admin.updateUserById(userId, { password });
  if (error) throw new Error(error.message);
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function table(headers: string[], rows: string[][]) {
  const th = headers.map((h) => `<th style="padding:8px;border:1px solid #e2e8f0;text-align:left;font-size:12px;background:#f8fafc">${esc(h)}</th>`).join('');
  const body = rows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;vertical-align:top">${esc(c)}</td>`).join('')}</tr>`,
    )
    .join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0">${`<tr>${th}</tr>`}${body}</table>`;
}

async function main() {
  assertOutreachEmailAllowed('send-admin-portal-roster-email.ts');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) process.exit(1);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const sgKey = await loadSendGridKey(db);
  if (!sgKey && !DRY_RUN) {
    console.error('SENDGRID_API_KEY not found');
    process.exit(1);
  }

  const passwordByEmail: Record<string, string> = {};

  // ── Apprentices (active program_enrollments) ───────────────────────────────
  const { data: enrollments } = await db
    .from('program_enrollments')
    .select('user_id, program_id, status, created_at')
    .order('created_at', { ascending: false });

  const apprenticeRows: string[][] = [];
  for (const e of enrollments ?? []) {
    const { data: prof } = await db.from('profiles').select('full_name, email, role').eq('id', e.user_id).maybeSingle();
    const { data: prog } = await db.from('programs').select('name, slug').eq('id', e.program_id).maybeSingle();
    const email = prof?.email ?? '';
    let pwd = passwordByEmail[email] ?? '—';
    if (RESET_PASSWORDS && email && !passwordByEmail[email]) {
      const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const u = listed?.users?.find((x) => x.email?.toLowerCase() === email.toLowerCase());
      if (u) {
        const p = tempPassword();
        if (!DRY_RUN) await setPassword(db, u.id, p);
        passwordByEmail[email] = p;
        pwd = p;
      }
    }
    apprenticeRows.push([
      prof?.full_name ?? '—',
      email,
      prog?.slug ?? '—',
      e.status ?? '—',
      pwd,
      `${SITE_URL}/learner/dashboard`,
    ]);
  }

  // ── Barber subscriptions ───────────────────────────────────────────────────
  const { data: barberSubs } = await db.from('barber_subscriptions').select('*').order('customer_name');
  const barberSubRows: string[][] = [];
  for (const b of barberSubs ?? []) {
    const email = b.customer_email ?? '';
    let pwd = passwordByEmail[email] ?? '—';
    if (RESET_PASSWORDS && email && !passwordByEmail[email]) {
      const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const u = listed?.users?.find((x) => x.email?.toLowerCase() === email.toLowerCase());
      if (u) {
        const p = tempPassword();
        if (!DRY_RUN) await setPassword(db, u.id, p);
        passwordByEmail[email] = p;
        pwd = p;
      }
    }
    barberSubRows.push([
      b.customer_name ?? '—',
      email,
      b.payment_status ?? b.status ?? '—',
      String(b.weekly_payment_cents ? `$${(b.weekly_payment_cents / 100).toFixed(2)}/wk` : '—'),
      pwd,
    ]);
  }

  // ── Program holders ────────────────────────────────────────────────────────
  const { data: holders } = await db
    .from('program_holders')
    .select('id, organization_name, contact_name, contact_email, contact_phone, status, mou_signed, mou_type, user_id')
    .order('organization_name');

  const holderRows: string[][] = [];
  for (const h of holders ?? []) {
    if (!h.contact_email || h.organization_name === 'Elevate for Humanity') continue;
    const { data: links } = await db
      .from('program_holder_programs')
      .select('programs(slug)')
      .eq('program_holder_id', h.id)
      .eq('status', 'active');
    const slugs = (links ?? []).map((l: { programs: { slug: string } | null }) => l.programs?.slug).filter(Boolean).join(', ') || '—';
    const email = h.contact_email;
    let pwd = passwordByEmail[email] ?? '—';
    if (RESET_PASSWORDS && email && !passwordByEmail[email] && h.user_id) {
      const p = tempPassword();
      if (!DRY_RUN) await setPassword(db, h.user_id, p);
      passwordByEmail[email] = p;
      pwd = p;
    }
    holderRows.push([
      h.organization_name ?? '—',
      h.contact_name ?? '—',
      email,
      h.contact_phone ?? '—',
      h.status ?? '—',
      h.mou_signed ? 'signed' : 'pending',
      slugs,
      pwd,
      `${SITE_URL}/program-holder/dashboard`,
    ]);
  }

  // ── Barber host shops ──────────────────────────────────────────────────────
  const { data: hostShops } = await db
    .from('barbershop_partner_applications')
    .select('shop_legal_name, contact_name, contact_email, contact_phone, status, mou_signed_at')
    .order('shop_legal_name');

  const hostRows: string[][] = [];
  for (const s of hostShops ?? []) {
    const email = s.contact_email ?? '';
    let pwd = passwordByEmail[email] ?? '—';
    if (RESET_PASSWORDS && email && !passwordByEmail[email]) {
      const { data: prof } = await db.from('profiles').select('id').eq('email', email).maybeSingle();
      let uid = prof?.id;
      if (!uid) {
        const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
        uid = listed?.users?.find((x) => x.email?.toLowerCase() === email.toLowerCase())?.id;
      }
      if (uid) {
        const p = tempPassword();
        if (!DRY_RUN) await setPassword(db, uid, p);
        passwordByEmail[email] = p;
        pwd = p;
      }
    }
    hostRows.push([
      s.shop_legal_name ?? '—',
      s.contact_name ?? '—',
      email,
      s.contact_phone ?? '—',
      s.status ?? '—',
      s.mou_signed_at ? 'MOU signed' : 'MOU pending',
      pwd,
      `${SITE_URL}/partner/dashboard`,
    ]);
  }

  const generatedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' });
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px"><tr><td align="center">
<table width="900" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;padding:32px">
<tr><td>
<h1 style="margin:0 0 8px;font-size:22px;color:#1e293b">Portal roster — apprentices, program holders &amp; host shops</h1>
<p style="margin:0 0 16px;font-size:13px;color:#64748b">Generated ${esc(generatedAt)} (America/Indiana/Indianapolis) · Login: <a href="${SITE_URL}/login">${SITE_URL}/login</a></p>
<p style="margin:0 0 20px;font-size:13px;color:#475569;line-height:1.6">
<strong>Passwords:</strong> ${RESET_PASSWORDS ? 'New temporary passwords were generated below (Supabase cannot retrieve old passwords).' : 'Password reset skipped — use existing credentials or run without --no-reset-passwords.'}
<strong> Confidential — admin eyes only.</strong> Recipients should change passwords after first login.
</p>

<h2 style="font-size:16px;margin:24px 0 8px">Active apprentices (program_enrollments)</h2>
${table(['Name', 'Email', 'Program', 'Status', 'Temp password', 'Dashboard'], apprenticeRows)}

<h2 style="font-size:16px;margin:24px 0 8px">Barber apprentice billing (barber_subscriptions)</h2>
${table(['Name', 'Email', 'Payment status', 'Weekly rate', 'Temp password'], barberSubRows)}

<h2 style="font-size:16px;margin:24px 0 8px">Program holders</h2>
${table(['Organization', 'Contact', 'Email', 'Phone', 'Status', 'MOU', 'Programs', 'Temp password', 'Dashboard'], holderRows)}

<h2 style="font-size:16px;margin:24px 0 8px">Barber host shops</h2>
${table(['Shop', 'Contact', 'Email', 'Phone', 'Status', 'MOU', 'Temp password', 'Dashboard'], hostRows)}

<p style="margin:24px 0 0;font-size:12px;color:#94a3b8">${PLATFORM_DEFAULTS.orgName} · automated ops report</p>
</td></tr></table>
</td></tr></table>
</body></html>`;

  const outDir = join(process.cwd(), 'exports', 'email-copies');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `admin-portal-roster-${Date.now()}.html`);
  writeFileSync(outPath, html, 'utf8');
  console.log('Wrote', outPath);

  if (DRY_RUN) {
    console.log('DRY RUN — would email', ADMIN);
    console.log('Apprentices:', apprenticeRows.length, 'Holders:', holderRows.length, 'Hosts:', hostRows.length);
    return;
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: ADMIN, name: 'Elizabeth Greene' }] }],
      from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate Ops' },
      reply_to: { email: ADMIN, name: 'Elizabeth Greene' },
      subject: `[Confidential] Portal roster — apprentices, program holders & host shops (${generatedAt})`,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  if (res.status !== 202) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
  console.log(`✅ Roster emailed to ${ADMIN}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
