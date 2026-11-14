#!/usr/bin/env node
/**
 * Audit apprentice portal routes + data prerequisites for a user email.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-apprentice-dashboards.mjs [email]
 */
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];
if (!email) throw new Error('Provide the learner email explicitly.');
const base = process.env.AUDIT_BASE_URL || 'https://app.elevateforhumanity.org';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const db = createClient(url, key);

const APPRENTICE_TABS = [
  '/apprentice/hours',
  '/apprentice/timeclock',
  '/apprentice/competencies',
  '/apprentice/billing',
  '/apprentice/handbook',
  '/apprentice/documents',
  '/apprentice/skills',
  '/apprentice',
  '/apprentice/orientation',
  '/apprentice/workbook',
  '/apprentice/rti',
  '/apprentice/theory-schedule',
  '/apprentice/transfer-hours',
];

const { data: profile, error: profileError } = await db.from('profiles').select('id,email,role').eq('email', email).maybeSingle();
if (profileError) throw profileError;
console.log(`\n=== Apprentice dashboard audit: ${email} ===\n`);
if (!profile) {
  console.error('No profile');
  process.exit(1);
}

console.log('Profile role:', profile.role);
if (['partner', 'host_shop', 'host_shop_admin'].includes(profile.role)) {
  console.log('Host shop account: verify partner_documents through partner_users; apprentice placement and learner uploads do not establish shop compliance.');
  process.exit(0);
}

const userId = profile.id;
const [pe, bs, ap, lp] = await Promise.all([
  db.from('program_enrollments').select('program_slug,enrollment_state,orientation_completed_at,course_id').eq('user_id', userId),
  db.from('barber_subscriptions').select('id,status,setup_fee_paid').eq('user_id', userId),
  db.from('apprentices').select('id,shop_id,status').eq('user_id', userId).maybeSingle(),
  db.from('lms_progress').select('course_id,status,progress_percent').eq('user_id', userId),
]);

for (const result of [pe, bs, ap, lp]) {
  if (result.error) throw result.error;
}
console.log('program_enrollments:', pe.data?.length ? pe.data : 'NONE');
console.log('barber_subscriptions:', bs.data?.length ? bs.data : 'NONE');
console.log('apprentices:', ap.data ?? 'NONE');
console.log('lms_progress:', lp.data?.length ? lp.data : 'NONE');

const courseIds = [...new Set((pe.data || []).map(row => row.course_id).filter(Boolean))];
if (!courseIds.length) console.log('No direct course ID; verify the canonical program-course fallback.');
for (const courseId of courseIds) {
  const { count, error } = await db.from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId).eq('is_published', true);
  if (error) throw error;
  console.log(`Assigned course ${courseId}: ${count ?? 0} published lessons`);
}

console.log(`\n--- HTTP probe (${base}) ---\n`);

async function probe(path) {
  const start = Date.now();
  try {
    const res = await fetch(`${base}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
    const ms = Date.now() - start;
    const loc = res.headers.get('location');
    const tag = res.status >= 300 && res.status < 400 ? `→ ${loc}` : '';
    const ok = res.status === 200 || (res.status >= 300 && res.status < 400);
    if (res.status >= 300 && res.status < 400) console.log('Redirect only; authenticated acceptance remains unverified.');
    console.log(`${ok ? 'HTTP' : 'ERROR'} ${String(res.status).padStart(3)} ${ms}ms ${path} ${tag}`);
    return ok;
  } catch (e) {
    console.log(`❌ ERR ${path} ${e.message}`);
    return false;
  }
}

let failures = 0;
for (const path of [...APPRENTICE_TABS, ...courseIds.map(id => `/lms/courses/${id}`)]) {
  if (!await probe(path)) failures++;
}
if (failures) process.exitCode = 1;
console.log('Anonymous HTTP probes do not verify authenticated learner access or dashboard rendering.');

console.log('\nDone.\n');
