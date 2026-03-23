/**
 * scripts/validate-lms-integrity.ts
 *
 * Validates the canonical LMS publication chain for all active programs.
 * Checks the full path: program → courses → course_modules → course_lessons → lms_lessons.
 *
 * Usage:
 *   npx tsx scripts/validate-lms-integrity.ts              # all programs
 *   npx tsx scripts/validate-lms-integrity.ts --slug prs   # one program slug
 *   npx tsx scripts/validate-lms-integrity.ts --fail-fast  # exit 1 on first failure
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 *
 * Designed to run in CI against the live DB (requires SUPABASE env vars).
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const SLUG_FILTER = (() => {
  const idx = process.argv.indexOf('--slug');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();
const FAIL_FAST = process.argv.includes('--fail-fast');

let supabase: ReturnType<typeof createClient>;

// ── Types ─────────────────────────────────────────────────────────────────────

interface CheckResult {
  program: string;
  check: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
let failures = 0;

function pass(program: string, check: string, detail: string) {
  results.push({ program, check, passed: true, detail });
}

function fail(program: string, check: string, detail: string) {
  failures++;
  results.push({ program, check, passed: false, detail });
  if (FAIL_FAST) {
    printResults();
    process.exit(1);
  }
}

// ── Checks ────────────────────────────────────────────────────────────────────

async function validateProgram(program: { id: string; slug: string; title: string }) {
  const slug = program.slug;

  // 1. courses row exists and program_id is correctly linked
  const { data: course } = await supabase
    .from('courses')
    .select('id, program_id, status, is_active')
    .eq('program_id', program.id)
    .maybeSingle();

  if (!course) {
    fail(slug, 'courses_row', 'No courses row linked to this program');
    return; // remaining checks depend on course existing
  }
  if (course.program_id !== program.id) {
    fail(slug, 'courses_program_id', `course.program_id=${course.program_id} != program.id=${program.id}`);
  } else {
    pass(slug, 'courses_program_id', `course_id=${course.id}`);
  }
  if (course.status !== 'published') {
    fail(slug, 'courses_status', `status=${course.status} (expected published)`);
  } else {
    pass(slug, 'courses_status', 'published');
  }

  const courseId = course.id;

  // 2. course_modules exist and all belong to this course
  const { data: modules, error: modErr } = await supabase
    .from('course_modules')
    .select('id, title, course_id, order_index')
    .eq('course_id', courseId);

  if (modErr || !modules || modules.length === 0) {
    fail(slug, 'course_modules_exist', 'No course_modules rows for this course');
    return;
  }
  const wrongCourseMods = modules.filter(m => m.course_id !== courseId);
  if (wrongCourseMods.length > 0) {
    fail(slug, 'course_modules_course_id', `${wrongCourseMods.length} modules have wrong course_id`);
  } else {
    pass(slug, 'course_modules_exist', `${modules.length} modules`);
  }

  // 3. course_lessons exist and all belong to this course
  const { data: lessons, error: lessonErr } = await supabase
    .from('course_lessons')
    .select('id, slug, course_id, module_id, order_index, lesson_type')
    .eq('course_id', courseId);

  if (lessonErr || !lessons || lessons.length === 0) {
    fail(slug, 'course_lessons_exist', 'No course_lessons rows for this course');
    return;
  }
  pass(slug, 'course_lessons_exist', `${lessons.length} lessons`);

  // 4. No orphaned lessons (module_id null or pointing outside this course)
  const moduleIds = new Set(modules.map(m => m.id));
  const orphans = lessons.filter(l => !l.module_id || !moduleIds.has(l.module_id));
  if (orphans.length > 0) {
    fail(slug, 'no_orphaned_lessons',
      `${orphans.length} lessons have null/cross-course module_id: ${orphans.slice(0, 3).map(l => l.slug).join(', ')}`
    );
  } else {
    pass(slug, 'no_orphaned_lessons', 'all lessons have valid module_id');
  }

  // 5. No empty modules (every module must have at least one lesson)
  const lessonsByModule = new Map<string, number>();
  for (const l of lessons) {
    if (l.module_id) lessonsByModule.set(l.module_id, (lessonsByModule.get(l.module_id) ?? 0) + 1);
  }
  const emptyMods = modules.filter(m => !lessonsByModule.has(m.id));
  if (emptyMods.length > 0) {
    fail(slug, 'no_empty_modules',
      `${emptyMods.length} modules have 0 lessons: ${emptyMods.map(m => m.title).join(', ')}`
    );
  } else {
    pass(slug, 'no_empty_modules', 'all modules have lessons');
  }

  // 6. Slug alignment: every course_lesson.slug must exist in curriculum_lessons for this program
  const { data: clSlugs } = await supabase
    .from('curriculum_lessons')
    .select('lesson_slug')
    .eq('program_id', program.id)
    .eq('status', 'published');

  const clSlugSet = new Set((clSlugs ?? []).map(r => r.lesson_slug));
  const driftedLessons = lessons.filter(l => !clSlugSet.has(l.slug));
  if (driftedLessons.length > 0) {
    fail(slug, 'slug_alignment',
      `${driftedLessons.length} course_lessons have slugs not in curriculum_lessons: ` +
      driftedLessons.slice(0, 3).map(l => l.slug).join(', ')
    );
  } else {
    pass(slug, 'slug_alignment', 'all slugs match curriculum_lessons');
  }

  // 7. Count parity: course_lessons count must equal published curriculum_lessons count
  const expectedCount = clSlugSet.size;
  if (lessons.length !== expectedCount) {
    fail(slug, 'lesson_count_parity',
      `course_lessons=${lessons.length} but published curriculum_lessons=${expectedCount}`
    );
  } else {
    pass(slug, 'lesson_count_parity', `${lessons.length} lessons match`);
  }

  // 8. lms_lessons view resolves lessons for this course (end-to-end view check)
  const { data: viewRows, error: viewErr } = await supabase
    .from('lms_lessons')
    .select('id, order_index, step_type')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (viewErr || !viewRows || viewRows.length === 0) {
    fail(slug, 'lms_lessons_view',
      viewErr ? `view error: ${viewErr.message}` : 'lms_lessons returns 0 rows for this course'
    );
  } else {
    // Check order_index is populated (not null) — the alias fix in Step 0
    const nullOrder = viewRows.filter(r => r.order_index == null);
    if (nullOrder.length > 0) {
      fail(slug, 'lms_lessons_order_index', `${nullOrder.length} rows have null order_index in lms_lessons view`);
    } else {
      pass(slug, 'lms_lessons_view', `${viewRows.length} rows visible, order_index populated`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  console.log('\nLMS Integrity Validation');
  console.log('========================');
  if (SLUG_FILTER) console.log(`Filter: --slug ${SLUG_FILTER}\n`);

  // Load programs
  let query = supabase
    .from('programs')
    .select('id, slug, title, published, is_active')
    .eq('published', true)
    .eq('is_active', true);

  if (SLUG_FILTER) query = query.eq('slug', SLUG_FILTER);

  const { data: programs, error } = await query;

  if (error) {
    console.error('Failed to load programs:', error.message);
    process.exit(1);
  }
  if (!programs || programs.length === 0) {
    console.error('No published+active programs found. Check DB or --slug filter.');
    process.exit(1);
  }

  console.log(`Checking ${programs.length} program(s)...\n`);

  for (const program of programs) {
    await validateProgram(program);
  }

  printResults();
  process.exit(failures > 0 ? 1 : 0);
}

function printResults() {
  // Group by program
  const byProgram = new Map<string, CheckResult[]>();
  for (const r of results) {
    if (!byProgram.has(r.program)) byProgram.set(r.program, []);
    byProgram.get(r.program)!.push(r);
  }

  for (const [program, checks] of byProgram) {
    const programFails = checks.filter(c => !c.passed).length;
    const status = programFails === 0 ? 'OK' : `FAIL (${programFails})`;
    console.log(`[${status}] ${program}`);
    for (const c of checks) {
      const icon = c.passed ? '  ✅' : '  ❌';
      console.log(`${icon} ${c.check}: ${c.detail}`);
    }
    console.log('');
  }

  const total = results.length;
  const passed = total - failures;
  console.log(`Results: ${passed}/${total} checks passed`);
  if (failures > 0) {
    console.log(`\n${failures} check(s) FAILED — LMS is not ready for these programs.`);
  } else {
    console.log('\nAll checks passed — canonical chain is intact.');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
