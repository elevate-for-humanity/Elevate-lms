/**
 * DB-only audit — verifies live migrations.
 * Run: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm tsx scripts/db-audit.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

let p = 0, f = 0;
const ok   = (l: string, d: string) => { console.log(`  ✅ ${l}: ${d}`); p++; };
const fail = (l: string, d: string) => { console.log(`  ❌ ${l}: ${d}`); f++; };

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('DB MIGRATION AUDIT');
  console.log('══════════════════════════════════════════════════════');

  // 1. program_id nullable
  console.log('\n── Migration 1: program_id nullable ──');
  const { data: nullRows, error: e0 } = await db
    .from('curriculum_lessons')
    .select('program_id')
    .is('program_id', null)
    .limit(1);
  if (e0) fail('program_id nullable', e0.message);
  else ok('program_id nullable', `null rows accessible (${nullRows?.length ?? 0} found)`);

  // 2. UNIQUE(course_id, lesson_order) constraint
  console.log('\n── Migration 2: UNIQUE constraints ──');
  const testId = '00000000-aaaa-0000-0000-000000000099';
  await db.from('curriculum_lessons').delete().eq('course_id', testId);

  const { error: e1 } = await db.from('curriculum_lessons').insert({
    course_id: testId,
    lesson_slug: 'audit-slug-1',
    lesson_title: 'Audit Test',
    lesson_order: 1,
    module_order: 1,
    module_title: 'Module',
    step_type: 'lesson',
    passing_score: 0,
    status: 'draft',
  });

  if (e1) {
    fail('first insert', e1.message);
  } else {
    // Try duplicate lesson_order
    const { error: e2 } = await db.from('curriculum_lessons').insert({
      course_id: testId,
      lesson_slug: 'audit-slug-2',
      lesson_title: 'Audit Test 2',
      lesson_order: 1, // duplicate — should be blocked
      module_order: 1,
      module_title: 'Module',
      step_type: 'lesson',
      passing_score: 0,
      status: 'draft',
    });
    if (e2?.code === '23505') {
      ok('UNIQUE(course_id, lesson_order)', `duplicate blocked (${e2.code})`);
    } else {
      fail('UNIQUE(course_id, lesson_order)', `NOT blocked: ${e2?.message ?? 'no error'}`);
    }

    // Try duplicate lesson_slug
    const { error: e3 } = await db.from('curriculum_lessons').insert({
      course_id: testId,
      lesson_slug: 'audit-slug-1', // duplicate slug — should be blocked
      lesson_title: 'Audit Test 3',
      lesson_order: 99,
      module_order: 1,
      module_title: 'Module',
      step_type: 'lesson',
      passing_score: 0,
      status: 'draft',
    });
    if (e3?.code === '23505') {
      ok('UNIQUE(course_id, lesson_slug)', `duplicate blocked (${e3.code})`);
    } else {
      fail('UNIQUE(course_id, lesson_slug)', `NOT blocked: ${e3?.message ?? 'no error'}`);
    }

    await db.from('curriculum_lessons').delete().eq('course_id', testId);
  }

  // 3. publish_course_from_staging function
  console.log('\n── Migration 3: publish_course_from_staging function ──');
  const { error: fnErr } = await db.rpc('publish_course_from_staging', {
    p_course_id: '00000000-0000-0000-0000-000000000001',
    p_program_id: null,
  });
  if (fnErr?.message?.includes('Course not found')) {
    ok('publish_course_from_staging()', `function live — "${fnErr.message}"`);
  } else if (!fnErr) {
    fail('publish_course_from_staging()', 'no error returned (expected "Course not found")');
  } else {
    fail('publish_course_from_staging()', `unexpected error: ${fnErr.message}`);
  }

  // 4. lms_lessons view accessible
  console.log('\n── lms_lessons view ──');
  const { data: lmsRows, error: lmsErr } = await db
    .from('lms_lessons')
    .select('id, step_type, is_published, lesson_source')
    .limit(3);
  if (lmsErr) fail('lms_lessons view', lmsErr.message);
  else ok('lms_lessons view', `accessible, ${lmsRows?.length ?? 0} sample rows`);

  // Summary
  console.log('\n══════════════════════════════════════════════════════');
  console.log(`DB AUDIT: ${p} passed, ${f} failed`);
  console.log(f === 0 ? '✅ ALL DB MIGRATIONS VERIFIED' : '❌ FAILURES — see above');
  console.log('══════════════════════════════════════════════════════\n');
  if (f > 0) process.exit(1);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
