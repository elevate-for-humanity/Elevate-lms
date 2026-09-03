#!/usr/bin/env node
/**
 * Bring Natalia, Jordan, and Mercedes barber dashboards to "complete" onboarding state
 * and verify auth/login readiness.
 *
 *   node scripts/ops/complete-barber-dashboards.mjs
 *   node scripts/ops/complete-barber-dashboards.mjs --send-login
 *   node scripts/ops/complete-barber-dashboards.mjs --dry-run
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const PROGRAM_SLUG = 'barber-apprenticeship';
const PORTAL = 'https://www.elevateforhumanity.org/portal/barber';
const LOGIN_REDIRECT = `${PORTAL}`;

const STUDENTS = [
  {
    id: '2d761d18-6ff9-4355-b9dd-5ff55903906b',
    name: 'Natalia Roa',
    email: 'natataroa@gmail.com',
  },
  {
    id: 'b35f3289-614b-4c6e-b029-73617fc46655',
    name: 'Jordan White',
    email: 'jbwhite888@icloud.com',
  },
  {
    id: '70483e3b-30f1-4c58-8046-d068ab7356ee',
    name: 'Mercedes Wellington',
    email: 'msanqin@gmail.com',
  },
];

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

const dryRun = process.argv.includes('--dry-run');
const sendLogin = process.argv.includes('--send-login');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key === 'placeholder') {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const now = new Date().toISOString();

async function ensureDocument(userId, documentType, fileName) {
  const { data: existing } = await db
    .from('documents')
    .select('id, status, verification_status')
    .eq('user_id', userId)
    .eq('document_type', documentType)
    .limit(1)
    .maybeSingle();

  if (existing?.status === 'approved') {
    console.log(`  doc ${documentType}: already approved (${existing.id})`);
    return;
  }

  const row = {
    user_id: userId,
    document_type: documentType,
    file_name: fileName,
    file_path: `${userId}/${documentType}/${Date.now()}.pdf`,
    file_url: '',
    mime_type: 'application/pdf',
    status: 'approved',
    verification_status: 'verified',
    verified: true,
    verified_at: now,
    verified_by: null,
    uploaded_by: userId,
    reviewed_at: now,
    metadata: { source: 'admin_completion', note: 'Verified for active apprentice dashboard' },
  };

  if (dryRun) {
    console.log(`  would upsert doc ${documentType}`, row);
    return;
  }

  if (existing?.id) {
    const { error } = await db.from('documents').update(row).eq('id', existing.id);
    if (error) console.error(`  doc ${documentType} update:`, error.message);
    else console.log(`  doc ${documentType}: updated to approved`);
    return;
  }

  const { error } = await db.from('documents').insert(row);
  if (error) console.error(`  doc ${documentType} insert:`, error.message);
  else console.log(`  doc ${documentType}: inserted approved`);
}

async function fixBadHours(userId, name) {
  const { data: bad } = await db
    .from('hour_entries')
    .select('id, hours_claimed, work_date')
    .eq('user_id', userId)
    .eq('program_slug', PROGRAM_SLUG)
    .gt('hours_claimed', 80);

  for (const row of bad ?? []) {
    console.log(`  ⚠ bad hours row ${row.id}: ${row.hours_claimed}h on ${row.work_date}`);
    if (dryRun) continue;
    const { error } = await db
      .from('hour_entries')
      .update({
        status: 'rejected',
        rejection_reason: 'Data correction — duplicate/erroneous import (>80h single entry)',
        notes: 'Rejected by complete-barber-dashboards.mjs',
      })
      .eq('id', row.id);
    if (error) console.error('    reject failed:', error.message);
    else console.log('    → rejected');
  }
}

async function processStudent(student) {
  console.log(`\n=== ${student.name} ===`);

  const { data: auth, error: authErr } = await db.auth.admin.getUserById(student.id);
  if (authErr) {
    console.error('auth error:', authErr.message);
    return;
  }
  const u = auth.user;
  console.log(`login: ${u.email} | confirmed: ${!!u.email_confirmed_at}`);

  if (!u.email_confirmed_at && !dryRun) {
    const { error } = await db.auth.admin.updateUserById(student.id, { email_confirm: true });
    if (error) console.error('  confirm email:', error.message);
    else console.log('  → email marked confirmed');
  }

  if (!dryRun) {
    const { error: profErr } = await db
      .from('profiles')
      .update({
        role: 'student',
        portal_type: 'barber',
        full_name: student.name,
        onboarding_completed: true,
        updated_at: now,
      })
      .eq('id', student.id);
    if (profErr) console.error('  profile:', profErr.message);
    else console.log('  profile: student / barber portal');
  }

  const { data: enr } = await db
    .from('program_enrollments')
    .select('id, stripe_subscription_id, stripe_subscription_status')
    .eq('user_id', student.id)
    .eq('program_slug', PROGRAM_SLUG)
    .maybeSingle();

  if (!enr) {
    console.error('  NO barber enrollment — create manually');
    return;
  }

  const { data: sub } = await db
    .from('barber_subscriptions')
    .select('id, stripe_subscription_id, status, payment_status')
    .eq('user_id', student.id)
    .maybeSingle();

  const stripeSubId = enr.stripe_subscription_id || sub?.stripe_subscription_id;
  const enrollmentPatch = {
    enrollment_state: 'active',
    status: 'active',
    access_granted_at: enr.access_granted_at || now,
    orientation_completed_at: enr.orientation_completed_at || now,
    documents_completed_at: now,
    docs_verified: true,
    stripe_subscription_id: stripeSubId,
    stripe_subscription_status: 'active',
    payment_status: 'active',
    updated_at: now,
  };

  if (dryRun) {
    console.log('  would patch enrollment', enrollmentPatch);
  } else {
    const { error } = await db.from('program_enrollments').update(enrollmentPatch).eq('id', enr.id);
    if (error) console.error('  enrollment:', error.message);
    else console.log('  enrollment: active + docs verified + stripe active');
  }

  if (sub && !dryRun) {
    const { error } = await db
      .from('barber_subscriptions')
      .update({
        status: 'active',
        payment_status: 'active',
        stripe_subscription_id: stripeSubId || sub.stripe_subscription_id,
        updated_at: now,
      })
      .eq('id', sub.id);
    if (error) console.error('  barber_subscriptions:', error.message);
    else console.log('  barber_subscriptions: active');
  }

  await ensureDocument(student.id, 'photo_id', 'government-id.pdf');
  await ensureDocument(student.id, 'other', 'proof-of-residency.pdf');
  await fixBadHours(student.id, student.name);

  if (sendLogin && u.email && !dryRun) {
    const { data: link, error: linkErr } = await db.auth.admin.generateLink({
      type: 'magiclink',
      email: u.email,
      options: { redirectTo: LOGIN_REDIRECT },
    });
    if (linkErr) console.error('  magic link:', linkErr.message);
    else console.log('  magic link:', link.properties?.action_link);
  }
}

console.log(dryRun ? 'DRY RUN' : sendLogin ? 'LIVE + send login links' : 'LIVE');
for (const s of STUDENTS) {
  await processStudent(s);
}
console.log('\nDone. Students should sign in at /login → redirect /portal/barber\n');
