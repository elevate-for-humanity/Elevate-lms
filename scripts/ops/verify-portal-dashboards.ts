#!/usr/bin/env tsx
/**
 * Read-only verification of program-holder and host-shop portal readiness.
 * No email and no database writes.
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/verify-portal-dashboards.ts
 */
import { createClient } from '@supabase/supabase-js';
import { outboundSiteUrl } from './outbound-site-url';

const SITE = outboundSiteUrl();

type Row = { label: string; ok: boolean; detail: string };

const EXPECTED_HOLDERS: { email: string; minPrograms: number; org?: string }[] = [
  { email: 'mesmerizedbybeautyl@yahoo.com', minPrograms: 3, org: 'Jozanna' },
  { email: 'info@centerofdestiny.org', minPrograms: 4, org: 'Carlina' },
  { email: 'indyondemandservices@gmail.com', minPrograms: 1, org: 'David / INDY ON DEMAND' },
  { email: 'amecosenterprise@gmail.com', minPrograms: 10, org: 'Ameco' },
  { email: 'doreen.hawkins01@outlook.com', minPrograms: 2, org: 'Doreen Hawkins' },
  { email: 'info@enchantedheartstraining.com', minPrograms: 0, org: 'Shawndra (MOU may block)' },
];

// Only currently active host-shop accounts belong in this production readiness list.
// Archived partners (including Prestige Elevation) are intentionally excluded.
const EXPECTED_HOST_SHOPS: { email: string; label: string }[] = [
  { email: 'calvincutz1985@gmail.com', label: 'Cals Kutz Studio / Calvin Pena' },
  { email: 'christopherd.newkirk@gmail.com', label: "B-52's Barber Shop / Chris Newkirk" },
  { email: 'adamkriech1@gmail.com', label: 'Kountry Kutz Barbershop / Adam Kriech' },
  { email: 'razorsimage11@gmail.com', label: "Razor's Image Barbershop / Aaron Brown" },
  { email: 'toryntreat7@icloud.com', label: 'Salon Saloon LLC / Tory Treat' },
  { email: 'styleandscissorsalon@gmail.com', label: 'Style and Scissor Salon / Corienne Meid' },
];

function gateHolderDashboard(holder: {
  status: string | null;
  mou_signed: boolean | null;
  approved_at: string | null;
}): { canDashboard: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (!holder.approved_at) blockers.push('not approved');
  if (!['approved', 'active'].includes(holder.status ?? '')) blockers.push(`status=${holder.status}`);
  if (!holder.mou_signed) blockers.push('MOU unsigned');
  return { canDashboard: blockers.length === 0, blockers };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase env');
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const rows: Row[] = [];
  let fail = 0;

  console.log(`\nPortal verification (read-only) · ${SITE}\n`);

  for (const exp of EXPECTED_HOLDERS) {
    const { data: holder } = await db
      .from('program_holders')
      .select('id, organization_name, contact_email, status, mou_signed, approved_at, user_id')
      .eq('contact_email', exp.email)
      .maybeSingle();

    if (!holder) {
      rows.push({ label: exp.org ?? exp.email, ok: false, detail: 'no program_holders row' });
      fail++;
      continue;
    }

    const { count: progCount } = await db
      .from('program_holder_programs')
      .select('id', { count: 'exact', head: true })
      .eq('program_holder_id', holder.id)
      .eq('status', 'active');

    const programsOk = (progCount ?? 0) >= exp.minPrograms;
    const gate = gateHolderDashboard(holder);

    let mouSigOk = true;
    if (holder.mou_signed && holder.user_id) {
      const { data: sig } = await db
        .from('mou_signatures')
        .select('id')
        .eq('user_id', holder.user_id)
        .maybeSingle();
      mouSigOk = Boolean(sig);
    }

    const { data: prof } = await db
      .from('profiles')
      .select('role, program_holder_id')
      .eq('email', exp.email)
      .maybeSingle();

    const roleOk = prof?.role === 'program_holder' && prof.program_holder_id === holder.id;
    const ok = programsOk && mouSigOk && roleOk;
    if (!ok) fail++;

    rows.push({
      label: `${holder.organization_name} <${exp.email}>`,
      ok,
      detail: [
        `programs=${progCount ?? 0}${exp.minPrograms ? ` (need ≥${exp.minPrograms})` : ''}`,
        gate.canDashboard ? 'dashboard=OK' : `dashboard=BLOCKED (${gate.blockers.join(', ')})`,
        mouSigOk ? 'mou_sig=OK' : 'mou_sig=MISSING',
        roleOk ? 'profile=OK' : `profile=bad role=${prof?.role ?? '?'}`,
        `login ${SITE}/login`,
      ].join(' · '),
    });
  }

  for (const exp of EXPECTED_HOST_SHOPS) {
    const { data: prof } = await db
      .from('profiles')
      .select('id, role')
      .eq('email', exp.email)
      .maybeSingle();

    let userId = prof?.id;
    if (!userId) {
      const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userId = listed?.users?.find((user) => user.email?.toLowerCase() === exp.email.toLowerCase())?.id;
    }

    const { data: partnerUser } = userId
      ? await db
          .from('partner_users')
          .select('partner_id, role, status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle()
      : { data: null };

    const { data: partner } = partnerUser?.partner_id
      ? await db
          .from('partners')
          .select('name, partner_type, type, program_type, status, approval_status, is_active')
          .eq('id', partnerUser.partner_id)
          .maybeSingle()
      : { data: null };

    const roleOk = ['partner', 'host_shop', 'host_shop_admin'].includes(prof?.role ?? '');
    const wired = Boolean(partnerUser?.partner_id);
    const activeLink = partnerUser?.status === 'active';
    const activePartner =
      partner?.status === 'active' &&
      partner?.approval_status === 'approved' &&
      partner?.is_active !== false;
    const typeText = [partner?.partner_type, partner?.type, partner?.program_type]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const hostShopType = /(barber|salon|shop|training_site|cosmet)/.test(typeText);

    const ok = Boolean(userId) && roleOk && wired && activeLink && activePartner && hostShopType;
    if (!ok) fail++;

    rows.push({
      label: exp.label,
      ok,
      detail: [
        userId ? 'auth=OK' : 'auth=MISSING',
        roleOk ? `role=${prof?.role}` : `role=${prof?.role ?? '?'}`,
        wired ? `partner_users=${partnerUser?.partner_id?.slice(0, 8)}…` : 'partner_users=MISSING',
        activeLink ? 'link=active' : `link=${partnerUser?.status ?? '?'}`,
        activePartner ? 'partner=active+approved' : `partner=${partner?.status ?? '?'}/${partner?.approval_status ?? '?'}`,
        hostShopType ? 'type=host-shop' : `type=${partner?.partner_type ?? '?'}`,
        `dashboard ${SITE}/host-shop/dashboard`,
      ].join(' · '),
    });
  }

  const width = Math.max(...rows.map((row) => row.label.length), 20);
  for (const row of rows) {
    console.log(`${row.ok ? '✅' : '❌'} ${row.label.padEnd(width)}  ${row.detail}`);
  }

  console.log(`\n${fail ? `❌ ${fail} issue(s)` : '✅ All checks passed'} · no emails sent\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
