/**
 * Kill test for createAndPublishProgram().
 *
 * Pass criteria (all must be true — any failure exits 1):
 *   ✅ programs row created
 *   ✅ courses row created
 *   ✅ course_modules rows created (count matches input)
 *   ✅ course_lessons rows created (count matches input)
 *   ✅ module_completion_rules rows created (one per module)
 *   ✅ publish_course() passed first try — no manual fixes
 *   ✅ programs.published = true
 *   ✅ lms_lessons view returns lessons for this course
 *   ✅ getPublishedCourseBySlug() returns the course with full module+lesson tree
 *
 * Run:
 *   npx tsx scripts/test-generator-one-shot.ts
 *   npx tsx scripts/test-generator-one-shot.ts --cleanup
 *
 * --cleanup deletes all rows created by this test run.
 * Each run uses a unique slug (cdl-generator-<timestamp>) so runs don't collide.
 */

import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { createAndPublishProgram } from '../lib/programs/create-and-publish-program';
import { getPublishedCourseBySlug } from '../lib/lms/course-repository';

const CLEANUP = process.argv.includes('--cleanup');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── Test input ────────────────────────────────────────────────────────────────

const slug = `cdl-generator-${Date.now()}`;

import type { ProgramCreateInput } from '../lib/programs/types';

const INPUT: ProgramCreateInput = {
  program: {
    slug,
    title: 'CDL Training Program',
    description: 'Fresh generator validation — safe to delete.',
    shortDescription: 'CDL generator kill test',
  },
  course: {},
  modules: [
    {
      slug: 'cdl-basics',
      title: 'CDL Basics & Regulations',
      orderIndex: 1,
      lessons: [
        {
          slug: `${slug}-overview`,
          title: 'CDL Overview & License Types',
          orderIndex: 1,
          lessonType: 'lesson',
          content: { body: 'CDL overview content' },
        },
        {
          slug: `${slug}-regs`,
          title: 'Federal Motor Carrier Safety Regulations',
          orderIndex: 2,
          lessonType: 'lesson',
          content: { body: 'FMCSA regulations content' },
        },
        {
          slug: `${slug}-checkpoint-1`,
          title: 'Module 1 Checkpoint',
          orderIndex: 3,
          lessonType: 'checkpoint',
          passingScore: 80,
          content: { questions: [] },
        },
      ],
    },
    {
      slug: 'vehicle-systems',
      title: 'Vehicle Systems & Inspection',
      orderIndex: 2,
      lessons: [
        {
          slug: `${slug}-pretrip`,
          title: 'Pre-Trip Inspection Procedure',
          orderIndex: 1,
          lessonType: 'lesson',
          content: { body: 'Pre-trip inspection content' },
        },
        {
          slug: `${slug}-air-brakes`,
          title: 'Air Brakes',
          orderIndex: 2,
          lessonType: 'lesson',
          content: { body: 'Air brakes content' },
        },
        {
          slug: `${slug}-checkpoint-2`,
          title: 'Module 2 Checkpoint',
          orderIndex: 3,
          lessonType: 'checkpoint',
          passingScore: 80,
          content: { questions: [] },
        },
      ],
    },
    {
      slug: 'road-safety',
      title: 'Road Safety & Exam Prep',
      orderIndex: 3,
      lessons: [
        {
          slug: `${slug}-hazards`,
          title: 'Hazard Perception & Defensive Driving',
          orderIndex: 1,
          lessonType: 'lesson',
          content: { body: 'Hazard perception content' },
        },
        {
          slug: `${slug}-exam-strategies`,
          title: 'Written Exam Strategies',
          orderIndex: 2,
          lessonType: 'lesson',
          content: { body: 'Exam strategies content' },
        },
        {
          slug: `${slug}-final-exam`,
          title: 'Final Exam',
          orderIndex: 3,
          lessonType: 'exam',
          passingScore: 80,
          content: { questions: [] },
        },
      ],
    },
  ],
  publish: true,
};

const EXPECTED_MODULES  = INPUT.modules.length;           // 3
const EXPECTED_LESSONS  = INPUT.modules.reduce((n, m) => n + m.lessons.length, 0); // 9

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function pass(label: string) {
  console.log(`  ✅ ${label}`);
  passed++;
}

function fail(label: string, detail?: string) {
  console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  failed++;
}

function section(title: string) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 54 - title.length))}`);
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

async function cleanup(programId: string, courseId: string) {
  section('Cleanup');
  // course_lessons, course_modules, module_completion_rules cascade from courses
  const { error: ce } = await db.from('courses').delete().eq('id', courseId);
  if (ce) fail(`delete courses row`, ce.message);
  else pass(`deleted courses row ${courseId}`);

  const { error: pe } = await db.from('programs').delete().eq('id', programId);
  if (pe) fail(`delete programs row`, pe.message);
  else pass(`deleted programs row ${programId}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Kill Test — createAndPublishProgram()');
  console.log(`  slug: ${slug}`);
  console.log('═══════════════════════════════════════════════════════════');

  // ── Step 1: Run the pipeline ───────────────────────────────────────────────
  section('Step 1: createAndPublishProgram()');
  console.log('  No manual inserts. No patch scripts. One call.\n');

  let result: Awaited<ReturnType<typeof createAndPublishProgram>>;
  try {
    result = await createAndPublishProgram(INPUT);
  } catch (err) {
    fail('createAndPublishProgram() threw', err instanceof Error ? err.message : String(err));
    console.error('\n  VERDICT: ❌ Pipeline threw before completing. Generator is not real.\n');
    process.exit(1);
  }

  pass(`programs row created: ${result.programId}`);
  pass(`courses row created:  ${result.courseId}`);

  if (result.moduleCount === EXPECTED_MODULES) {
    pass(`${result.moduleCount}/${EXPECTED_MODULES} modules created`);
  } else {
    fail(`module count`, `expected ${EXPECTED_MODULES}, got ${result.moduleCount}`);
  }

  if (result.lessonCount === EXPECTED_LESSONS) {
    pass(`${result.lessonCount}/${EXPECTED_LESSONS} lessons created`);
  } else {
    fail(`lesson count`, `expected ${EXPECTED_LESSONS}, got ${result.lessonCount}`);
  }

  if (result.published) {
    pass('publish_course() passed first try — no manual fixes');
  } else {
    fail('publish_course() did not run or did not pass');
  }

  // ── Step 2: Verify DB rows directly ───────────────────────────────────────
  section('Step 2: DB row verification');

  const { count: modCount } = await db
    .from('course_modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', result.courseId);

  if (modCount === EXPECTED_MODULES) {
    pass(`DB: ${modCount} course_modules rows`);
  } else {
    fail(`DB course_modules count`, `expected ${EXPECTED_MODULES}, got ${modCount}`);
  }

  const { count: lessonCount } = await db
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', result.courseId);

  if (lessonCount === EXPECTED_LESSONS) {
    pass(`DB: ${lessonCount} course_lessons rows`);
  } else {
    fail(`DB course_lessons count`, `expected ${EXPECTED_LESSONS}, got ${lessonCount}`);
  }

  const { count: ruleCount } = await db
    .from('module_completion_rules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', result.courseId);

  if ((ruleCount ?? 0) >= EXPECTED_MODULES) {
    pass(`DB: ${ruleCount} module_completion_rules rows`);
  } else {
    fail(`DB module_completion_rules count`, `expected ≥${EXPECTED_MODULES}, got ${ruleCount}`);
  }

  // Verify no NULL lesson_type (publish guard would have caught this, but double-check)
  const { data: nullTypes } = await db
    .from('course_lessons')
    .select('slug')
    .eq('course_id', result.courseId)
    .is('lesson_type', null);

  if (!nullTypes?.length) {
    pass('All lessons have lesson_type set (no NULLs)');
  } else {
    fail(`${nullTypes.length} lessons have NULL lesson_type`, nullTypes.map(l => l.slug).join(', '));
  }

  // Verify FK integrity: every lesson has a module_id
  const { data: orphans } = await db
    .from('course_lessons')
    .select('slug')
    .eq('course_id', result.courseId)
    .is('module_id', null);

  if (!orphans?.length) {
    pass('All lessons have module_id (FK intact)');
  } else {
    fail(`${orphans.length} lessons have NULL module_id`, orphans.map(l => l.slug).join(', '));
  }

  // Verify programs.published = true
  const { data: prog } = await db
    .from('programs')
    .select('published, status')
    .eq('id', result.programId)
    .single();

  if (prog?.published === true) {
    pass(`programs.published = true`);
  } else {
    fail(`programs.published`, `expected true, got ${prog?.published}`);
  }

  // Verify courses.status = 'published'
  const { data: courseRow } = await db
    .from('courses')
    .select('status')
    .eq('id', result.courseId)
    .single();

  if (courseRow?.status === 'published') {
    pass(`courses.status = 'published'`);
  } else {
    fail(`courses.status`, `expected 'published', got '${courseRow?.status}'`);
  }

  // ── Step 3: lms_lessons view ───────────────────────────────────────────────
  section('Step 3: lms_lessons view visibility');

  const { data: viewRows, error: viewErr } = await db
    .from('lms_lessons')
    .select('id, title, step_type, lesson_source')
    .eq('course_id', result.courseId);

  if (viewErr) {
    fail('lms_lessons query failed', viewErr.message);
  } else if ((viewRows?.length ?? 0) === EXPECTED_LESSONS) {
    pass(`lms_lessons view returns ${viewRows!.length} lessons`);
    pass(`lesson_source = '${viewRows![0]?.lesson_source}'`);
  } else {
    fail(
      `lms_lessons view count`,
      `expected ${EXPECTED_LESSONS}, got ${viewRows?.length ?? 0}` +
      (viewRows?.length === 0 ? ' — course may not be published or view not applied' : '')
    );
  }

  // ── Step 4: course-repository read path ───────────────────────────────────
  section('Step 4: getPublishedCourseBySlug()');

  try {
    const course = await getPublishedCourseBySlug(db, slug);

    if (course.slug === slug) {
      pass(`course found by slug: ${slug}`);
    } else {
      fail('slug mismatch', `expected ${slug}, got ${course.slug}`);
    }

    if (course.course_modules.length === EXPECTED_MODULES) {
      pass(`${course.course_modules.length} modules in tree`);
    } else {
      fail('module count in tree', `expected ${EXPECTED_MODULES}, got ${course.course_modules.length}`);
    }

    const totalLessons = course.course_modules.reduce(
      (n, m) => n + m.course_lessons.length, 0
    );
    if (totalLessons === EXPECTED_LESSONS) {
      pass(`${totalLessons} lessons in tree`);
    } else {
      fail('lesson count in tree', `expected ${EXPECTED_LESSONS}, got ${totalLessons}`);
    }

    // Verify modules are sorted by order_index
    const orders = course.course_modules.map(m => m.order_index);
    const isSorted = orders.every((v, i) => i === 0 || v >= orders[i - 1]);
    if (isSorted) {
      pass('modules sorted by order_index');
    } else {
      fail('modules not sorted', orders.join(', '));
    }
  } catch (err) {
    fail('getPublishedCourseBySlug() threw', err instanceof Error ? err.message : String(err));
  }

  // ── Verdict ────────────────────────────────────────────────────────────────
  if (CLEANUP) {
    await cleanup(result.programId, result.courseId);
  } else {
    console.log(`\n  (Run with --cleanup to delete test rows for slug: ${slug})`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  RESULT: ${passed} passed, ${failed} failed`);
  console.log('─────────────────────────────────────────────────────────');

  if (failed === 0) {
    console.log('  VERDICT: ✅ Generator is real. Zero manual intervention.');
    console.log('           One call. Full pipeline. Publish passed first try.');
  } else {
    console.log('  VERDICT: ❌ Generator is incomplete. See failures above.');
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(failed === 0 ? 0 : 1);
}

main().catch(err => {
  console.error('\nUnhandled error:', err);
  process.exit(1);
});
