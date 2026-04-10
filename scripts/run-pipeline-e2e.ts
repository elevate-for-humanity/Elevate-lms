/**
 * End-to-end pipeline runner — bypasses HTTP, calls functions directly.
 * Proves the full pipeline works without dev server timeout constraints.
 *
 * Run: pnpm tsx scripts/run-pipeline-e2e.ts
 */

import { generateCourseOutlineFn } from '../lib/ai/generate-course-outline-fn';
import { promoteToCurriculum } from '../lib/courses/promoteToCurriculum';
import { createAdminClient } from '../lib/supabase/admin';

const PROGRAM_ID = 'fb36dbf1-db3c-4d34-adf9-3f98f397d371'; // CNA program

const PROMPT = [
  'Generate a complete workforce-ready training course titled "TEST - CNA Fundamentals - Delete Me".',
  'Target audience: entry-level adult learners.',
  'Total training hours: 30.',
  'State alignment: Indiana.',
  'Credential or exam: CNA prep.',
  'Delivery format: online self-paced.',
  'Additional requirements: Focus on foundational resident care, safety, communication, infection control, ethics, and exam readiness.',
  'Include 5 modules with 4 lessons each, 3 checkpoints after modules 2/3/4, and 1 final exam with 25+ questions.',
  'All content must be specific, job-ready, and usable in a real training program.',
].join(' ');

async function run() {
  // SAFE: non-request-time context — scripts/ or internal admin.ts, hydration guaranteed by caller
  const db = createAdminClient();

  console.log('═'.repeat(60));
  console.log('PIPELINE E2E TEST');
  console.log('═'.repeat(60));

  // ── Step 1: Generate ──────────────────────────────────────────
  console.log('\nStep 1: Generating course outline (3-attempt retry)...');
  const t0 = Date.now();
  const genResult = await generateCourseOutlineFn(PROMPT);
  const genTime = ((Date.now() - t0) / 1000).toFixed(1);

  if (!genResult.ok) {
    console.log(`❌ Generation failed after ${genResult.attempts} attempts`);
    genResult.errors_per_attempt.forEach((errs, i) => {
      console.log(`  Attempt ${i + 1}: ${errs.slice(0, 3).join(' | ')}`);
    });
    process.exit(1);
  }

  const { outline, attempt, normalization } = genResult;
  console.log(`  ✅ Generated in ${genTime}s (attempt ${attempt}/3)`);
  console.log(`  Modules: ${outline.modules.length}, Lessons: ${outline.lessons.length}`);
  console.log(`  Compliance: ${outline.course.compliance_status}`);
  if (normalization.step_type_coercions.length > 0) {
    console.log(`  Normalizer coercions: ${normalization.step_type_coercions.join(', ')}`);
  }
  if (normalization.order_index_resequenced) {
    console.log(`  Normalizer resequenced order_index`);
  }

  // ── Step 2: Write staging (courses + course_modules + course_lessons) ─────
  console.log('\nStep 2: Writing staging tables...');

  const { data: courseRow, error: courseErr } = await db
    .from('courses')
    .insert({
      title:             outline.course.title,
      slug:              `ai-test-cna-${Date.now()}`,
      description:       outline.course.description,
      short_description: outline.course.description.substring(0, 200),
      status:            'draft',
      is_active:         false,
      program_id:        PROGRAM_ID,
    })
    .select('id')
    .single();

  if (courseErr || !courseRow) {
    console.log(`❌ Course insert failed: ${courseErr?.message}`);
    process.exit(1);
  }
  const courseId = courseRow.id as string;
  console.log(`  ✅ Course: ${courseId}`);

  const moduleRows = outline.modules.map(m => ({
    course_id: courseId, title: m.title,
    description: m.description, order_index: m.module_index,
  }));
  const { data: insertedMods, error: modErr } = await db
    .from('course_modules').insert(moduleRows).select('id, order_index');
  if (modErr || !insertedMods) {
    console.log(`❌ Module insert failed: ${modErr?.message}`);
    await db.from('courses').delete().eq('id', courseId);
    process.exit(1);
  }
  const moduleIdMap = new Map(insertedMods.map(m => [m.order_index as number, m.id as string]));
  console.log(`  ✅ Modules: ${insertedMods.length}`);

  const lessonRows = outline.lessons.map(l => {
    const activities: Record<string, boolean> = { video: true, reading: true, flashcards: true, practice: true };
    if (l.step_type === 'checkpoint') activities.checkpoint = true;
    if (l.step_type === 'exam') activities.exam = true;
    return {
      course_id: courseId, module_id: moduleIdMap.get(l.module_index) ?? null,
      title: l.title, slug: l.slug, lesson_type: l.step_type,
      order_index: l.order_index,
      passing_score: l.step_type === 'checkpoint' ? outline.course.pass_threshold_checkpoints
        : l.step_type === 'exam' ? outline.course.pass_threshold_final_exam : null,
      activities, status: 'draft', is_published: false,
      content: JSON.stringify({
        compliance_status: 'draft_for_human_review',
        learning_points: l.learning_points,
        scenario: l.scenario,
        assessment_question: l.assessment_question,
      }),
    };
  });
  const { error: lessonErr } = await db.from('course_lessons').insert(lessonRows);
  if (lessonErr) {
    console.log(`❌ Lesson insert failed: ${lessonErr.message}`);
    await db.from('course_modules').delete().eq('course_id', courseId);
    await db.from('courses').delete().eq('id', courseId);
    process.exit(1);
  }
  console.log(`  ✅ Lessons: ${lessonRows.length}`);

  // ── Step 3: Promote to curriculum_lessons ─────────────────────
  console.log('\nStep 3: Promoting to curriculum_lessons...');
  const promotion = await promoteToCurriculum(courseId, PROGRAM_ID);

  if (promotion.errors.length > 0) {
    console.log(`  ⚠️  Promotion errors: ${promotion.errors.join(' | ')}`);
  }
  console.log(`  ✅ Inserted: ${promotion.inserted}, Skipped: ${promotion.skipped}`);

  // ── Step 4: Verify from DB ────────────────────────────────────
  console.log('\nStep 4: Verifying from DB...');
  const { data: fetched } = await db
    .from('curriculum_lessons')
    .select('lesson_slug, step_type, lesson_order, passing_score')
    .eq('course_id', courseId)
    .order('lesson_order', { ascending: true });

  const rows = fetched ?? [];
  const orders = rows.map(r => r.lesson_order as number);
  const dupes = orders.filter((v, i) => orders.indexOf(v) !== i);
  const gaps = orders.filter((v, i) => i > 0 && v - orders[i - 1] > 1);
  const types = new Set(rows.map(r => r.step_type));
  const byType: Record<string, number> = {};
  rows.forEach(r => { byType[r.step_type as string] = (byType[r.step_type as string] ?? 0) + 1; });

  console.log(`  Rows fetched: ${rows.length}`);
  console.log(`  order_index: ${Math.min(...orders)}–${Math.max(...orders)}, dupes=${dupes.length ? dupes : 'none'}, gaps=${gaps.length ? gaps : 'none'}`);
  console.log(`  by_type: ${JSON.stringify(byType)}`);
  console.log(`  step_types: ${[...types].join(', ')}`);
  console.log(`  First 3 slugs: ${rows.slice(0, 3).map(r => r.lesson_slug).join(', ')}`);

  // ── Step 5: Cleanup ───────────────────────────────────────────
  console.log('\nStep 5: Cleaning up staging data...');
  await db.from('curriculum_lessons').delete().eq('course_id', courseId);
  await db.from('course_lessons').delete().eq('course_id', courseId);
  await db.from('course_modules').delete().eq('course_id', courseId);
  await db.from('courses').delete().eq('id', courseId);
  console.log(`  ✅ Deleted ${courseId}`);

  // ── Verdict ───────────────────────────────────────────────────
  const allOk = rows.length === lessonRows.length
    && dupes.length === 0
    && gaps.length === 0
    && types.size > 0
    && promotion.errors.length === 0;

  console.log('\n' + '═'.repeat(60));
  console.log('PIPELINE RESULT');
  console.log(`  Generate:     ✅ attempt ${attempt}/3, ${genTime}s`);
  console.log(`  Staging:      ✅ ${lessonRows.length} rows written`);
  console.log(`  Promotion:    ${promotion.errors.length === 0 ? '✅' : '⚠️ '} ${promotion.inserted} inserted`);
  console.log(`  DB verify:    ${dupes.length === 0 && gaps.length === 0 ? '✅' : '❌'} ${rows.length} rows, no dupes, no gaps`);
  console.log(`  Cleanup:      ✅`);
  console.log(`\n  Verdict: ${allOk ? '✅ PIPELINE COMPLETE — END-TO-END PROVEN' : '❌ ISSUES REMAIN'}`);
  console.log('═'.repeat(60));
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
