/**
 * Generator hardening tests.
 *
 * Runs after the kill test passes. Covers:
 *
 *   Test 1 — Schema assertions
 *     assertPipelineSchema() must pass against the live DB.
 *     Catches column drift, missing FKs, and wrong lms_lessons view source.
 *
 *   Test 2 — Relationship traversal regression
 *     getPublishedCourseBySlug() must return a full module+lesson tree.
 *     Catches PostgREST FK cache failures (the exact failure mode fixed
 *     by adding course_modules_course_id_fkey).
 *
 *   Test 3 — Orphan check
 *     No course_modules or course_lessons rows should reference a
 *     course_id that doesn't exist in courses.
 *
 *   Test 4 — Idempotency
 *     Running createAndPublishProgram() twice on the same slug must:
 *       - Not throw on the second run
 *       - Produce exactly the same module/lesson counts (no duplicates)
 *       - Leave the course in published state
 *
 * Run:
 *   npx tsx scripts/test-generator-hardening.ts
 *   npx tsx scripts/test-generator-hardening.ts --cleanup
 */

import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { createAndPublishProgram } from '../lib/programs/create-and-publish-program';
import { getPublishedCourseBySlug } from '../lib/lms/course-repository';
import { assertPipelineSchema } from '../lib/programs/assert-schema';
import type { ProgramCreateInput } from '../lib/programs/types';

const CLEANUP = process.argv.includes('--cleanup');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── Counters ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function pass(label: string) { console.log(`  ✅ ${label}`); passed++; }
function fail(label: string, detail?: string) {
  console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  failed++;
}
function section(title: string) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 54 - title.length))}`);
}

// ── Shared test program ───────────────────────────────────────────────────────

const slug = `hardening-${Date.now()}`;

const INPUT: ProgramCreateInput = {
  program: {
    slug,
    title: 'Hardening Test Program',
    description: 'Generator hardening test — safe to delete.',
    shortDescription: 'Hardening test',
    category: 'workforce',
  },
  course: {},
  modules: [
    {
      slug: 'mod-a',
      title: 'Module A',
      orderIndex: 1,
      lessons: [
        { slug: `${slug}-a1`, title: 'Lesson A1', orderIndex: 1, lessonType: 'lesson', content: {} },
        { slug: `${slug}-a2`, title: 'Lesson A2', orderIndex: 2, lessonType: 'lesson', content: {} },
        { slug: `${slug}-a-cp`, title: 'Checkpoint A', orderIndex: 3, lessonType: 'checkpoint', passingScore: 80, content: {} },
      ],
    },
    {
      slug: 'mod-b',
      title: 'Module B',
      orderIndex: 2,
      lessons: [
        { slug: `${slug}-b1`, title: 'Lesson B1', orderIndex: 1, lessonType: 'lesson', content: {} },
        { slug: `${slug}-b-exam`, title: 'Final Exam', orderIndex: 2, lessonType: 'exam', passingScore: 80, content: {} },
      ],
    },
  ],
  publish: true,
};

const EXPECTED_MODULES = INPUT.modules.length;
const EXPECTED_LESSONS = INPUT.modules.reduce((n, m) => n + m.lessons.length, 0);

// ── Cleanup ───────────────────────────────────────────────────────────────────

async function cleanup(programId: string, courseId: string) {
  section('Cleanup');
  const { error: ce } = await db.from('courses').delete().eq('id', courseId);
  if (ce) fail('delete courses row', ce.message); else pass(`deleted courses ${courseId}`);
  const { error: pe } = await db.from('programs').delete().eq('id', programId);
  if (pe) fail('delete programs row', pe.message); else pass(`deleted programs ${programId}`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function testSchemaAssertions() {
  section('Test 1: Schema assertions (assertPipelineSchema)');

  // Only runs if SUPABASE_MANAGEMENT_TOKEN is set
  if (!process.env.SUPABASE_MANAGEMENT_TOKEN) {
    console.log('  ⚠  SUPABASE_MANAGEMENT_TOKEN not set — skipping schema assertion test');
    console.log('     Set it to a Supabase personal access token to enable this check.');
    return;
  }

  try {
    await assertPipelineSchema();
    pass('assertPipelineSchema() passed — all columns, FKs, and view confirmed');
  } catch (e) {
    fail('assertPipelineSchema() failed', e instanceof Error ? e.message : String(e));
  }
}

async function testRelationshipTraversal(courseSlug: string) {
  section('Test 2: Relationship traversal regression (getPublishedCourseBySlug)');

  try {
    const course = await getPublishedCourseBySlug(db, courseSlug);

    if (course.slug === courseSlug) {
      pass(`course found by slug`);
    } else {
      fail('slug mismatch', `expected ${courseSlug}, got ${course.slug}`);
    }

    if (course.course_modules.length === EXPECTED_MODULES) {
      pass(`${course.course_modules.length} modules in tree`);
    } else {
      fail('module count', `expected ${EXPECTED_MODULES}, got ${course.course_modules.length}`);
    }

    const totalLessons = course.course_modules.reduce((n, m) => n + m.course_lessons.length, 0);
    if (totalLessons === EXPECTED_LESSONS) {
      pass(`${totalLessons} lessons in tree`);
    } else {
      fail('lesson count', `expected ${EXPECTED_LESSONS}, got ${totalLessons}`);
    }

    // Verify sort order
    const modOrders = course.course_modules.map(m => m.order_index);
    if (modOrders.every((v, i) => i === 0 || v >= modOrders[i - 1])) {
      pass('modules sorted by order_index');
    } else {
      fail('modules not sorted', modOrders.join(', '));
    }

    for (const mod of course.course_modules) {
      const lessonOrders = mod.course_lessons.map(l => l.order_index);
      if (!lessonOrders.every((v, i) => i === 0 || v >= lessonOrders[i - 1])) {
        fail(`lessons in "${mod.title}" not sorted`, lessonOrders.join(', '));
      }
    }
    pass('all lessons sorted by order_index within modules');

  } catch (e) {
    fail('getPublishedCourseBySlug() threw', e instanceof Error ? e.message : String(e));
  }
}

async function testOrphanCheck() {
  section('Test 3: Orphan check (course_modules and course_lessons)');

  const { count: orphanModules } = await db
    .from('course_modules')
    .select('id', { count: 'exact', head: true })
    .not('course_id', 'in', `(select id from courses)`);

  // Supabase JS doesn't support subqueries in .not() — use RPC or raw count
  // Instead: count modules whose course_id is not in courses via two queries
  const { data: allModules } = await db
    .from('course_modules')
    .select('course_id');

  const { data: allCourses } = await db
    .from('courses')
    .select('id');

  const courseIds = new Set((allCourses ?? []).map(c => c.id));
  const orphanedModules = (allModules ?? []).filter(m => !courseIds.has(m.course_id));

  if (orphanedModules.length === 0) {
    pass('No orphaned course_modules rows');
  } else {
    fail(`${orphanedModules.length} orphaned course_modules rows (course_id not in courses)`);
  }

  const { data: allLessons } = await db
    .from('course_lessons')
    .select('course_id');

  const orphanedLessons = (allLessons ?? []).filter(l => !courseIds.has(l.course_id));

  if (orphanedLessons.length === 0) {
    pass('No orphaned course_lessons rows');
  } else {
    fail(`${orphanedLessons.length} orphaned course_lessons rows (course_id not in courses)`);
  }

  // Suppress unused variable warning
  void orphanModules;
}

async function testIdempotency(programId: string, courseId: string) {
  section('Test 4: Idempotency (run generator twice on same slug)');

  let secondResult: Awaited<ReturnType<typeof createAndPublishProgram>>;
  try {
    secondResult = await createAndPublishProgram(INPUT);
  } catch (e) {
    fail('second run threw', e instanceof Error ? e.message : String(e));
    return;
  }

  pass('second run did not throw');

  // programId and courseId must be the same (upsert on slug)
  if (secondResult.programId === programId) {
    pass('programId unchanged (upsert idempotent)');
  } else {
    fail('programId changed on second run', `first: ${programId}, second: ${secondResult.programId}`);
  }

  if (secondResult.courseId === courseId) {
    pass('courseId unchanged (upsert idempotent)');
  } else {
    fail('courseId changed on second run', `first: ${courseId}, second: ${secondResult.courseId}`);
  }

  // Module and lesson counts must be identical — no duplicates
  const { count: modCount } = await db
    .from('course_modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', secondResult.courseId);

  if (modCount === EXPECTED_MODULES) {
    pass(`DB: ${modCount} course_modules after second run (no duplicates)`);
  } else {
    fail('module count after second run', `expected ${EXPECTED_MODULES}, got ${modCount}`);
  }

  const { count: lessonCount } = await db
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', secondResult.courseId);

  if (lessonCount === EXPECTED_LESSONS) {
    pass(`DB: ${lessonCount} course_lessons after second run (no duplicates)`);
  } else {
    fail('lesson count after second run', `expected ${EXPECTED_LESSONS}, got ${lessonCount}`);
  }

  // Course must still be published
  const { data: courseRow } = await db
    .from('courses')
    .select('status')
    .eq('id', secondResult.courseId)
    .single();

  if (courseRow?.status === 'published') {
    pass('courses.status = published after second run');
  } else {
    fail('courses.status after second run', `got ${courseRow?.status}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Generator Hardening Tests');
  console.log(`  slug: ${slug}`);
  console.log('═══════════════════════════════════════════════════════════');

  // Test 1: schema assertions (independent of test program)
  await testSchemaAssertions();

  // Create the test program (used by tests 2, 3, 4)
  section('Setup: createAndPublishProgram()');
  let result: Awaited<ReturnType<typeof createAndPublishProgram>>;
  try {
    result = await createAndPublishProgram(INPUT);
    pass(`program created: ${result.programId}`);
    pass(`course created:  ${result.courseId}`);
    pass(`published: ${result.published}`);
  } catch (e) {
    fail('setup failed', e instanceof Error ? e.message : String(e));
    console.error('\n  Cannot continue — setup failed.\n');
    process.exit(1);
  }

  // Test 2: relationship traversal
  await testRelationshipTraversal(slug);

  // Test 3: orphan check (global — checks entire DB, not just test program)
  await testOrphanCheck();

  // Test 4: idempotency
  await testIdempotency(result.programId, result.courseId);

  // Cleanup
  if (CLEANUP) {
    await cleanup(result.programId, result.courseId);
  } else {
    console.log(`\n  (Run with --cleanup to delete test rows for slug: ${slug})`);
  }

  // Verdict
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  RESULT: ${passed} passed, ${failed} failed`);
  console.log('─────────────────────────────────────────────────────────');
  if (failed === 0) {
    console.log('  VERDICT: ✅ All hardening checks passed.');
  } else {
    console.log('  VERDICT: ❌ Hardening checks failed. See above.');
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(failed === 0 ? 0 : 1);
}

main().catch(err => {
  console.error('\nUnhandled error:', err);
  process.exit(1);
});
