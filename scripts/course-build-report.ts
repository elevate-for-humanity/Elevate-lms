/**
 * scripts/course-build-report.ts
 *
 * Post-build completeness report for one or all programs.
 *
 * Usage:
 *   pnpm course:report                        # all programs
 *   pnpm course:report --program hvac-technician
 *   pnpm course:report --fail-fast            # exit 1 if any program fails
 *
 * A program PASSES only when every gate is green.
 * A program FAILS if any required field is missing, null, or below threshold.
 *
 * Definition of a complete course (canonical contract):
 *   1. courses row exists, linked to correct program, status=published, is_active=true
 *   2. module count matches blueprint (or ≥1 if no blueprint registered)
 *   3. lesson count matches blueprint (or ≥1)
 *   4. every lesson has a module assignment (no orphans)
 *   5. order_index values are unique within the course (no duplicates)
 *   6. every 'lesson' step_type has non-empty content (≥300 chars stripped)
 *   7. every 'checkpoint'/'exam'/'quiz' step_type has ≥3 quiz_questions
 *   8. zero cross-program quiz contamination
 *   9. lms_lessons view returns same count as course_lessons
 *  10. no lesson renders as null/placeholder in the view (content field non-null)
 */

import 'dotenv/config';
import path from 'path';
import { config } from 'dotenv';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { getBlueprintForProgram } from '@/lib/curriculum/builders/getBlueprintForProgram';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Types ─────────────────────────────────────────────────────────────────────

interface GateResult {
  gate: string;
  passed: boolean;
  detail: string;
}

interface ProgramReport {
  slug: string;
  passed: boolean;
  gates: GateResult[];
  blockers: string[];   // gates that failed
  warnings: string[];   // non-blocking observations
}

// ── Gate helpers ──────────────────────────────────────────────────────────────

function gate(name: string, passed: boolean, detail: string): GateResult {
  return { gate: name, passed, detail };
}

// ── Per-program report ────────────────────────────────────────────────────────

async function reportProgram(slug: string): Promise<ProgramReport> {
  const gates: GateResult[] = [];
  const warnings: string[] = [];

  // ── Resolve program + course ──────────────────────────────────────────────
  const { data: program } = await db
    .from('programs')
    .select('id, slug, title')
    .eq('slug', slug)
    .single();

  if (!program) {
    return {
      slug,
      passed: false,
      gates: [gate('program_exists', false, `No program row found for slug '${slug}'`)],
      blockers: [`No program row found for slug '${slug}'`],
      warnings: [],
    };
  }

  const { data: course } = await db
    .from('courses')
    .select('id, status, is_active, published_at')
    .eq('program_id', program.id)
    .single();

  gates.push(gate(
    'course_exists',
    !!course,
    course ? `course id=${course.id}` : 'No courses row for this program'
  ));

  if (!course) {
    return { slug, passed: false, gates, blockers: ['No courses row'], warnings };
  }

  gates.push(gate(
    'course_published',
    course.status === 'published' && course.is_active === true,
    `status=${course.status} is_active=${course.is_active}`
  ));

  // ── Module count ──────────────────────────────────────────────────────────
  const { count: moduleCount } = await db
    .from('course_modules')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', course.id);

  const blueprint = getBlueprintForProgram(slug);
  const expectedModules = blueprint?.modules?.length ?? null;
  const modulesOk = expectedModules !== null
    ? moduleCount === expectedModules
    : (moduleCount ?? 0) >= 1;

  gates.push(gate(
    'module_count',
    modulesOk,
    expectedModules !== null
      ? `${moduleCount}/${expectedModules} modules`
      : `${moduleCount} modules (no blueprint — require ≥1)`
  ));

  // ── Lesson count ──────────────────────────────────────────────────────────
  const { data: lessons } = await db
    .from('course_lessons')
    .select('id, slug, lesson_type, content, quiz_questions, module_id, order_index')
    .eq('course_id', course.id);

  const lessonCount = lessons?.length ?? 0;
  const expectedLessons = blueprint
    ? blueprint.modules.reduce((sum, m) => sum + (m.lessonCount ?? 0), 0)
    : null;
  const lessonsOk = expectedLessons !== null
    ? lessonCount === expectedLessons
    : lessonCount >= 1;

  gates.push(gate(
    'lesson_count',
    lessonsOk,
    expectedLessons !== null
      ? `${lessonCount}/${expectedLessons} lessons`
      : `${lessonCount} lessons (no blueprint — require ≥1)`
  ));

  if (!lessons || lessonCount === 0) {
    return {
      slug, passed: false, gates,
      blockers: ['No course_lessons rows'],
      warnings,
    };
  }

  // ── Orphaned lessons ──────────────────────────────────────────────────────
  const orphaned = lessons.filter(l => !l.module_id);
  gates.push(gate(
    'no_orphaned_lessons',
    orphaned.length === 0,
    orphaned.length === 0
      ? 'All lessons have module assignment'
      : `${orphaned.length} lessons missing module_id: ${orphaned.map(l => l.slug).join(', ')}`
  ));

  // ── Duplicate order_index ─────────────────────────────────────────────────
  const orderCounts = new Map<number, number>();
  for (const l of lessons) {
    orderCounts.set(l.order_index, (orderCounts.get(l.order_index) ?? 0) + 1);
  }
  const dupes = [...orderCounts.entries()].filter(([, c]) => c > 1);
  gates.push(gate(
    'unique_order_index',
    dupes.length === 0,
    dupes.length === 0
      ? 'All order_index values unique'
      : `${dupes.length} duplicate order_index values: ${dupes.map(([i]) => i).join(', ')}`
  ));

  // ── Content completeness ──────────────────────────────────────────────────
  const contentLessons = lessons.filter(l => l.lesson_type === 'lesson');
  const emptyContent = contentLessons.filter(l => {
    if (!l.content) return true;
    const raw = typeof l.content === 'string' ? l.content : JSON.stringify(l.content);
    const stripped = raw.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').trim();
    return stripped.length < 300;
  });

  gates.push(gate(
    'content_completeness',
    emptyContent.length === 0,
    emptyContent.length === 0
      ? `All ${contentLessons.length} content lessons have sufficient content`
      : `${emptyContent.length}/${contentLessons.length} content lessons have null/empty/thin content: ${emptyContent.slice(0, 5).map(l => l.slug).join(', ')}${emptyContent.length > 5 ? ` +${emptyContent.length - 5} more` : ''}`
  ));

  // ── Quiz completeness ─────────────────────────────────────────────────────
  const assessmentLessons = lessons.filter(l =>
    ['checkpoint', 'exam', 'quiz'].includes(l.lesson_type)
  );
  const missingQuiz = assessmentLessons.filter(l => {
    const q = l.quiz_questions;
    if (!q) return true;
    const arr = Array.isArray(q) ? q : [];
    return arr.length < 3;
  });

  gates.push(gate(
    'quiz_completeness',
    missingQuiz.length === 0,
    missingQuiz.length === 0
      ? `All ${assessmentLessons.length} assessment lessons have ≥3 quiz questions`
      : `${missingQuiz.length}/${assessmentLessons.length} assessment lessons missing quiz_questions: ${missingQuiz.slice(0, 5).map(l => l.slug).join(', ')}${missingQuiz.length > 5 ? ` +${missingQuiz.length - 5} more` : ''}`
  ));

  // ── Cross-program contamination ───────────────────────────────────────────
  // Spot-check: quiz first questions should not contain keywords from unrelated programs
  const FOREIGN_KEYWORDS: Record<string, string[]> = {
    'hvac-technician': ['quickbooks', 'accounting equation', 'chart of accounts', 'payroll', 'income statement'],
    'bookkeeping': ['refrigerant', 'hvac', 'epa 608', 'compressor'],
    'peer-recovery-specialist-jri': ['refrigerant', 'quickbooks', 'hvac'],
    'certified-recovery-specialist': ['refrigerant', 'quickbooks', 'hvac'],
  };
  const foreignKw = FOREIGN_KEYWORDS[slug] ?? [];
  const contaminated = foreignKw.length > 0
    ? lessons.filter(l => {
        if (!l.quiz_questions) return false;
        const arr = Array.isArray(l.quiz_questions) ? l.quiz_questions : [];
        const firstQ = ((arr[0] as { question?: string })?.question ?? '').toLowerCase();
        return foreignKw.some(kw => firstQ.includes(kw));
      })
    : [];

  gates.push(gate(
    'no_cross_program_contamination',
    contaminated.length === 0,
    contaminated.length === 0
      ? 'No cross-program quiz contamination detected'
      : `${contaminated.length} lessons have foreign quiz content: ${contaminated.map(l => l.slug).join(', ')}`
  ));

  // ── lms_lessons view parity ───────────────────────────────────────────────
  const { count: viewCount } = await db
    .from('lms_lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', course.id);

  gates.push(gate(
    'lms_view_parity',
    viewCount === lessonCount,
    `lms_lessons view: ${viewCount} rows, course_lessons: ${lessonCount} rows`
  ));

  // ── View content non-null ─────────────────────────────────────────────────
  const { count: nullViewContent } = await db
    .from('lms_lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', course.id)
    .is('content', null);

  const contentLessonCount = contentLessons.length;
  gates.push(gate(
    'view_content_non_null',
    (nullViewContent ?? 0) === 0 || contentLessonCount === 0,
    nullViewContent === 0
      ? 'All lms_lessons rows have non-null content'
      : `${nullViewContent} lms_lessons rows have null content (learner will see unpublished state)`
  ));

  // ── Compile result ────────────────────────────────────────────────────────
  const blockers = gates.filter(g => !g.passed).map(g => `[${g.gate}] ${g.detail}`);
  const passed = blockers.length === 0;

  return { slug, passed, gates, blockers, warnings };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const programArg = args.find((_, i) => args[i - 1] === '--program');
  const failFast = args.includes('--fail-fast');

  // Get all programs if none specified
  let slugs: string[];
  if (programArg) {
    slugs = [programArg];
  } else {
    const { data: programs } = await db
      .from('programs')
      .select('slug')
      .eq('is_active', true)
      .neq('status', 'archived')
      .order('slug');
    slugs = (programs ?? []).map((p: { slug: string }) => p.slug);
  }

  const reports: ProgramReport[] = [];
  let anyFailed = false;

  for (const slug of slugs) {
    const report = await reportProgram(slug);
    reports.push(report);
    if (!report.passed) anyFailed = true;
  }

  // ── Output ────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  COURSE BUILD REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const r of reports) {
    const status = r.passed ? '✅ COMPLETE' : '❌ INCOMPLETE';
    console.log(`${status}  ${r.slug}`);

    if (!r.passed) {
      console.log('  BLOCKERS:');
      for (const b of r.blockers) {
        console.log(`    ✗ ${b}`);
      }
    }

    if (r.warnings.length > 0) {
      console.log('  WARNINGS:');
      for (const w of r.warnings) {
        console.log(`    ⚠ ${w}`);
      }
    }

    // Gate detail (verbose)
    if (process.env.VERBOSE || args.includes('--verbose')) {
      for (const g of r.gates) {
        console.log(`    ${g.passed ? '✓' : '✗'} [${g.gate}] ${g.detail}`);
      }
    }

    console.log('');
  }

  const passed = reports.filter(r => r.passed).length;
  const failed = reports.filter(r => !r.passed).length;

  console.log('───────────────────────────────────────────────────────────');
  console.log(`  ${passed} complete  |  ${failed} incomplete  |  ${reports.length} total`);
  console.log('───────────────────────────────────────────────────────────\n');

  if (failed > 0) {
    console.log('A course is INCOMPLETE if any gate fails.');
    console.log('"Scaffolded", "structurally complete", and "amber state" are not valid statuses.');
    console.log('A course is either COMPLETE, BLOCKED, or BROKEN.\n');
  }

  if (failFast && anyFailed) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error('course-build-report failed:', e.message);
  process.exit(1);
});
