#!/usr/bin/env node
/**
 * Audit apprentice portal routes + data prerequisites for a user email.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-apprentice-dashboards.mjs [email]
 */
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2] || 'elizabethpowell6262@gmail.com';
const base = process.env.AUDIT_BASE_URL || 'http://localhost:3000';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const db = createClient(url, key);

const PORTALS = [
  { slug: 'barber-apprenticeship', path: '/portal/barber' },
  { slug: 'cosmetology-apprenticeship', path: '/portal/cosmetology' },
  { slug: 'esthetician-apprenticeship', path: '/portal/esthetician' },
  { slug: 'nail-technician-apprenticeship', path: '/portal/nail-technician' },
  { slug: 'culinary-apprenticeship', path: '/portal/culinary' },
  { slug: 'electrical', path: '/portal/electrical' },
  { slug: 'plumbing', path: '/portal/plumbing' },
];

const APPRENTICE_TABS = [
  '/apprentice/hours',
  '/apprentice/timeclock',
  '/apprentice/competencies',
  '/apprentice/billing',
  '/apprentice/handbook',
  '/apprentice/documents',
  '/apprentice/skills',
  '/programs/barber-apprenticeship/orientation',
  '/programs/barber-apprenticeship/documents',
];

const { data: profile } = await db.from('profiles').select('id,email,role').eq('email', email).maybeSingle();
console.log(`\n=== Apprentice dashboard audit: ${email} ===\n`);
if (!profile) {
  console.error('No profile');
  process.exit(1);
}

const userId = profile.id;
const [pe, bs, ap, lp] = await Promise.all([
  db.from('program_enrollments').select('program_slug,enrollment_state,orientation_completed_at,course_id').eq('user_id', userId),
  db.from('barber_subscriptions').select('id,status,setup_fee_paid').eq('user_id', userId),
  db.from('apprentices').select('id,shop_id,status').eq('user_id', userId).maybeSingle(),
  db.from('lms_progress').select('course_id,status,progress_percent').eq('user_id', userId),
]);

console.log('Profile role:', profile.role);
console.log('program_enrollments:', pe.data?.length ? pe.data : 'NONE');
console.log('barber_subscriptions:', bs.data?.length ? bs.data : 'NONE');
console.log('apprentices:', ap.data ?? 'NONE');
console.log('lms_progress:', lp.data?.length ? lp.data : 'NONE');

const courseId = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const { count: lessonCount } = await db
  .from('course_lessons')
  .select('id', { count: 'exact', head: true })
  .eq('course_id', courseId);
console.log(`barber course lessons: ${lessonCount ?? 0}`);

console.log(`\n--- HTTP probe (${base}) ---\n`);

async function probe(path) {
  const start = Date.now();
  try {
    const res = await fetch(`${base}${path}`, { redirect: 'manual' });
    const ms = Date.now() - start;
    const loc = res.headers.get('location');
    const tag = res.status >= 300 && res.status < 400 ? `→ ${loc}` : '';
    const ok = res.status === 200 || (res.status >= 300 && res.status < 400);
    console.log(`${ok ? '✅' : '❌'} ${String(res.status).padStart(3)} ${ms}ms ${path} ${tag}`);
    return ok;
  } catch (e) {
    console.log(`❌ ERR ${path} ${e.message}`);
    return false;
  }
}

for (const p of PORTALS) await probe(p.path);
for (const p of APPRENTICE_TABS) await probe(p);
await probe(`/lms/courses/${courseId}`);

console.log('\nDone.\n');
