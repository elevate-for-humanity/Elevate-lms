#!/usr/bin/env node
/**
 * Credit approved OJL hours for all active apprenticeship enrollments (barber + cosmetology).
 *
 *   node scripts/ops/apprentice-week-hours.mjs
 *   node scripts/ops/apprentice-week-hours.mjs --hours 40 --dry-run
 *   node scripts/ops/apprentice-week-hours.mjs --work-date 2026-06-05
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const APPROVED_BY = 'scripts/ops/apprentice-week-hours.mjs';

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

/** Friday of the ISO week containing `d` (Sat/Sun use the Friday just ended). */
function fridayOfCurrentWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getUTCDay();
  const diff = day === 0 ? -2 : day === 6 ? -1 : 5 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

function mondayOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

loadEnvLocal();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const hoursIdx = args.indexOf('--hours');
const hours = hoursIdx >= 0 ? parseFloat(args[hoursIdx + 1]) : 40;
const workDateIdx = args.indexOf('--work-date');
const workDate = workDateIdx >= 0 ? args[workDateIdx + 1] : fridayOfCurrentWeek();
const weekStart = mondayOfWeek(new Date(workDate + 'T12:00:00Z'));
const note = `Week of ${weekStart} — ${hours}h OJL (admin batch ${new Date().toISOString().slice(0, 10)})`;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key === 'placeholder') {
  console.error('Missing real Supabase credentials in .env.local');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { data: enrollments, error: enrErr } = await db
  .from('program_enrollments')
  .select('user_id, program_slug, enrollment_state')
  .ilike('program_slug', '%apprentice%')
  .in('enrollment_state', ['active', 'enrolled', 'onboarding']);

if (enrErr) {
  console.error('Failed to load enrollments:', enrErr.message);
  process.exit(1);
}

const userIds = [...new Set((enrollments || []).map((e) => e.user_id))];
const { data: profiles } = await db
  .from('profiles')
  .select('id, full_name, email')
  .in('id', userIds);
const nameById = Object.fromEntries(
  (profiles || []).map((p) => [p.id, p.full_name || p.email || p.id]),
);

console.log(`Apprentice week hours: ${hours}h each, work_date=${workDate}`);
if (dryRun) console.log('DRY RUN — no writes\n');

const approvedAt = new Date().toISOString();

for (const enr of enrollments || []) {
  const name = nameById[enr.user_id] || enr.user_id;
  const programSlug = enr.program_slug;

  const { data: existing } = await db
    .from('hour_entries')
    .select('id, hours_claimed, status, approval_status')
    .eq('user_id', enr.user_id)
    .eq('program_slug', programSlug)
    .eq('work_date', workDate)
    .eq('source_type', 'ojl')
    .maybeSingle();

  const patch = {
    hours_claimed: hours,
    accepted_hours: hours,
    status: 'approved',
    approval_status: 'approved',
    notes: note,
    approved_at: approvedAt,
    approved_by: APPROVED_BY,
  };

  if (existing) {
    const needsUpdate =
      Number(existing.hours_claimed) !== hours ||
      existing.status !== 'approved' ||
      existing.approval_status !== 'approved';

    if (!needsUpdate) {
      console.log(`${name} (${programSlug}): already ${hours}h approved`);
      continue;
    }

    if (dryRun) {
      console.log(`${name}: would update ${existing.id}`, patch);
      continue;
    }

    const { error } = await db.from('hour_entries').update(patch).eq('id', existing.id);
    if (error) console.error(`${name}: update failed —`, error.message);
    else console.log(`${name} (${programSlug}): updated ${existing.id} → ${hours}h approved`);
    continue;
  }

  const row = {
    user_id: enr.user_id,
    program_slug: programSlug,
    work_date: workDate,
    source_type: 'ojl',
    category: 'on-the-job',
    entered_by_email: 'ops@elevateforhumanity.org',
    ...patch,
  };

  if (dryRun) {
    console.log(`${name}: would insert`, row);
    continue;
  }

  const { data, error } = await db.from('hour_entries').insert(row).select('id').single();
  if (error) console.error(`${name}: insert failed —`, error.message);
  else console.log(`${name} (${programSlug}): inserted ${data.id} (${hours}h approved)`);
}

console.log('\nDone.');
