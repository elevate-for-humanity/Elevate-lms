/**
 * Concurrency test for createAndPublishProgram().
 *
 * Fires 5 simultaneous calls on the same slug.
 * The pipeline uses upsert + wipe-and-rebuild, so concurrent calls on the
 * same slug will race. The DB unique indexes (added in migration
 * 20260504000003) will cause some runs to fail with constraint violations.
 *
 * Pass criteria:
 *   - Exactly 1 programs row exists after all runs settle
 *   - Exactly 1 courses row exists after all runs settle
 *   - Module and lesson counts match the input (no duplicates, no missing)
 *   - The course is in published state
 *
 * We do NOT require all 5 runs to succeed — concurrent writes to the same
 * slug are expected to conflict. What matters is that the DB is left in a
 * consistent, correct state after the dust settles.
 *
 * Run:
 *   npx tsx scripts/test-generator-concurrency.ts --cleanup
 */

import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { createAndPublishProgram } from '../lib/programs/create-and-publish-program';
import type { ProgramCreateInput } from '../lib/programs/types';

const CLEANUP = process.argv.includes('--cleanup');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { console.error('❌ Missing Supabase env vars'); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false } });

const slug = `concurrency-test-${Date.now()}`;

const INPUT: ProgramCreateInput = {
  program: {
    slug,
    title: 'Concurrency Test Program',
    description: 'Concurrency safety validation — safe to delete.',
    category: 'workforce',
  },
  course: {},
  modules: [
    {
      slug: 'con-mod-1',
      title: 'Module 1',
      orderIndex: 1,
      lessons: [
        { slug: `${slug}-l1`, title: 'Lesson 1', orderIndex: 1, lessonType: 'lesson', content: {} },
        { slug: `${slug}-l2`, title: 'Lesson 2', orderIndex: 2, lessonType: 'lesson', content: {} },
      ],
    },
    {
      slug: 'con-mod-2',
      title: 'Module 2',
      orderIndex: 2,
      lessons: [
        { slug: `${slug}-l3`, title: 'Lesson 3', orderIndex: 1, lessonType: 'lesson', content: {} },
      ],
    },
  ],
  publish: true,
};

const EXPECTED_MODULES = INPUT.modules.length;
const EXPECTED_LESSONS = INPUT.modules.reduce((n, m) => n + m.lessons.length, 0);

let passed = 0;
let failed = 0;
function pass(msg: string) { console.log(`  ✅ ${msg}`); passed++; }
function fail(msg: string, detail?: string) { console.error(`  ❌ ${msg}${detail ? ` — ${detail}` : ''}`); failed++; }

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Concurrency Test — 5 simultaneous createAndPublishProgram()');
  console.log(`  slug: ${slug}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const RUNS = 5;
  const results = await Promise.allSettled(
    Array.from({ length: RUNS }, () => createAndPublishProgram(INPUT))
  );

  const fulfilled = results.filter(r => r.status === 'fulfilled').length;
  const rejected  = results.filter(r => r.status === 'rejected').length;
  console.log(`  ${fulfilled}/${RUNS} runs fulfilled, ${rejected}/${RUNS} rejected (conflicts expected)\n`);

  // At least one run must have succeeded
  if (fulfilled === 0) {
    fail('All runs rejected — at least one must succeed');
    process.exit(1);
  }
  pass(`${fulfilled} run(s) completed successfully`);

  // Exactly 1 programs row
  const { data: programs } = await db.from('programs').select('id').eq('slug', slug);
  if (programs?.length === 1) {
    pass('Exactly 1 programs row (no duplicates)');
  } else {
    fail('programs row count', `expected 1, got ${programs?.length ?? 0}`);
  }

  // Exactly 1 courses row
  const { data: courses } = await db.from('courses').select('id, status').eq('slug', slug);
  if (courses?.length === 1) {
    pass('Exactly 1 courses row (no duplicates)');
  } else {
    fail('courses row count', `expected 1, got ${courses?.length ?? 0}`);
  }

  if (!courses?.length) { process.exit(1); }
  const courseId = courses[0].id;

  // Course is published
  if (courses[0].status === 'published') {
    pass('courses.status = published');
  } else {
    fail('courses.status', `expected published, got ${courses[0].status}`);
  }

  // Correct module count (no duplicates from concurrent wipe+rebuild)
  const { count: modCount } = await db
    .from('course_modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);

  if (modCount === EXPECTED_MODULES) {
    pass(`${modCount} course_modules (no duplicates)`);
  } else {
    fail('course_modules count', `expected ${EXPECTED_MODULES}, got ${modCount}`);
  }

  // Correct lesson count
  const { count: lessonCount } = await db
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);

  if (lessonCount === EXPECTED_LESSONS) {
    pass(`${lessonCount} course_lessons (no duplicates)`);
  } else {
    fail('course_lessons count', `expected ${EXPECTED_LESSONS}, got ${lessonCount}`);
  }

  // Cleanup
  if (CLEANUP) {
    await db.from('courses').delete().eq('id', courseId);
    await db.from('programs').delete().eq('slug', slug);
    console.log(`\n  Cleaned up slug: ${slug}`);
  } else {
    console.log(`\n  (Run with --cleanup to delete test rows for slug: ${slug})`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  RESULT: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('  VERDICT: ✅ Concurrency test passed. DB consistent after concurrent writes.');
  } else {
    console.log('  VERDICT: ❌ Concurrency test failed. See above.');
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(failed === 0 ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(1); });
