/**
 * End-to-end smoke test for generate-and-publish-course pipeline.
 *
 * One command. Covers:
 *   - Route call succeeds
 *   - course_lessons row count = 24, all is_published=true
 *   - curriculum_lessons row count = 24
 *   - lms_lessons view returns 24 rows, source=canonical
 *   - step_type distribution: lesson=20, checkpoint=3, exam=1
 *   - order_index: 1–24, no gaps, no duplicates
 *   - Checkpoints at orders 9, 14, 19; exam at 24
 *   - Cleanup: all rows removed after test
 *
 * Usage:
 *   pnpm tsx scripts/smoke-test-pipeline.ts
 *   KEEP_COURSE=1 pnpm tsx scripts/smoke-test-pipeline.ts  # skip cleanup
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SVCKEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ROUTE    = process.env.ROUTE_URL ?? 'http://localhost:3000';
const KEEP     = process.env.KEEP_COURSE === '1';

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail: string) {
  if (condition) { console.log(`  ✅ ${label}: ${detail}`); passed++; }
  else           { console.log(`  ❌ ${label}: ${detail}`); failed++; }
}

async function cleanup(courseId: string) {
  await db.from('curriculum_lessons').delete().eq('course_id', courseId);
  await db.from('course_lessons').delete().eq('course_id', courseId);
  await db.from('course_modules').delete().eq('course_id', courseId);
  await db.from('courses').delete().eq('id', courseId);
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('PIPELINE SMOKE TEST');
  console.log(`Route: ${ROUTE}`);
  console.log('══════════════════════════════════════════════════════\n');

  // ── 1. Call route ─────────────────────────────────────────────────────────
  console.log('── Step 1: Generate and publish course ──');
  const t0 = Date.now();
  const res = await fetch(`${ROUTE}/api/ai/generate-and-publish-course`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Service-Key': SVCKEY },
    body: JSON.stringify({
      title: 'SMOKE-TEST CNA Fundamentals',
      audience: 'entry-level adult learners',
      hours: 30,
      state: 'Indiana',
      credentialOrExam: 'CNA prep',
      deliveryFormat: 'online self-paced',
      prompt: 'Focus on foundational resident care, safety, communication, infection control, ethics, and exam readiness.',
    }),
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const body = await res.json();

  check('route_status',   res.status === 200 && body.ok === true, `HTTP ${res.status}, ok=${body.ok}, attempt=${body.generation_attempt}, ${elapsed}s`);
  if (res.status !== 200 || !body.ok) {
    console.log(`  Fatal: ${JSON.stringify(body)}`);
    process.exit(1);
  }

  const courseId = body.course_id as string;
  console.log(`  course_id: ${courseId}`);
  check('modules_inserted',   body.modules_inserted === 5,  `modules_inserted=${body.modules_inserted}`);
  check('lessons_published',  body.lessons_published === 24, `lessons_published=${body.lessons_published}`);
  check('curriculum_inserted', body.curriculum_lessons_inserted === 24, `curriculum_lessons_inserted=${body.curriculum_lessons_inserted}`);

  // ── 2. Verify course_lessons ──────────────────────────────────────────────
  console.log('\n── Step 2: Verify course_lessons ──');
  const { data: cl } = await db
    .from('course_lessons')
    .select('id, order_index, lesson_type, slug, is_published, status')
    .eq('course_id', courseId)
    .order('order_index');

  check('cl_count',     cl?.length === 24,                        `count=${cl?.length}`);
  check('cl_published', cl?.every(r => r.is_published === true) ?? false, `all is_published=true`);
  check('cl_status',    cl?.every(r => r.status === 'published') ?? false, `all status=published`);

  const clOrders = cl?.map(r => r.order_index as number).sort((a,b) => a-b) ?? [];
  check('cl_order_min', clOrders[0] === 1,                        `min=${clOrders[0]}`);
  check('cl_order_max', clOrders[clOrders.length-1] === 24,       `max=${clOrders[clOrders.length-1]}`);
  check('cl_no_gaps',   clOrders.every((o,i) => i === 0 || o === clOrders[i-1]+1), `sequential`);
  check('cl_no_dupes',  new Set(clOrders).size === clOrders.length, `no duplicates`);

  // ── 3. Verify curriculum_lessons ──────────────────────────────────────────
  console.log('\n── Step 3: Verify curriculum_lessons ──');
  const { data: cur } = await db
    .from('curriculum_lessons')
    .select('id, lesson_order, step_type, lesson_slug')
    .eq('course_id', courseId)
    .order('lesson_order');

  check('cur_count', cur?.length === 24, `count=${cur?.length}`);

  // ── 4. Verify lms_lessons read path ──────────────────────────────────────
  console.log('\n── Step 4: Verify lms_lessons view (read path) ──');
  const { data: lms, error: lmsErr } = await db
    .from('lms_lessons')
    .select('id, order_index, step_type, slug, is_published, lesson_source')
    .eq('course_id', courseId)
    .order('order_index');

  check('lms_no_error',  !lmsErr,                                  lmsErr ? lmsErr.message : 'ok');
  check('lms_count',     lms?.length === 24,                       `count=${lms?.length}`);
  check('lms_source',    lms?.every(r => r.lesson_source === 'canonical') ?? false, `all source=canonical`);
  check('lms_published', lms?.every(r => r.is_published === true) ?? false, `all is_published=true`);

  // ── 5. Verify step_type distribution ─────────────────────────────────────
  console.log('\n── Step 5: Verify step_type distribution ──');
  const lessons     = lms?.filter(r => r.step_type === 'lesson')     ?? [];
  const checkpoints = lms?.filter(r => r.step_type === 'checkpoint') ?? [];
  const exams       = lms?.filter(r => r.step_type === 'exam')       ?? [];

  check('type_lesson',     lessons.length === 20,     `lesson=${lessons.length}`);
  check('type_checkpoint', checkpoints.length === 3,  `checkpoint=${checkpoints.length}`);
  check('type_exam',       exams.length === 1,        `exam=${exams.length}`);

  const cpOrders = checkpoints.map(r => r.order_index as number).sort((a,b) => a-b);
  check('checkpoint_placement', JSON.stringify(cpOrders) === '[9,14,19]', `checkpoint orders=${JSON.stringify(cpOrders)}`);
  check('exam_placement',       exams[0]?.order_index === 24,             `exam order=${exams[0]?.order_index}`);

  // ── 6. Verify course page HTTP response ───────────────────────────────────
  console.log('\n── Step 6: Verify course page HTTP response ──');
  const pageRes = await fetch(`${ROUTE}/lms/courses/${courseId}`, { redirect: 'manual' });
  // Expect 307 → /login (auth-gated) — not 404 or 500
  check('course_page_not_404', pageRes.status !== 404, `HTTP ${pageRes.status} (307=auth-gated, expected)`);
  check('course_page_not_500', pageRes.status !== 500, `HTTP ${pageRes.status}`);

  const firstLessonId = lms?.[0]?.id as string;
  const lessonRes = await fetch(`${ROUTE}/lms/courses/${courseId}/lessons/${firstLessonId}`, { redirect: 'manual' });
  check('lesson_page_not_404', lessonRes.status !== 404, `HTTP ${lessonRes.status}`);
  check('lesson_page_not_500', lessonRes.status !== 500, `HTTP ${lessonRes.status}`);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  if (!KEEP) {
    console.log('\n── Cleanup ──');
    await cleanup(courseId);
    const { count: remaining } = await db.from('courses').select('*', { count: 'exact', head: true }).eq('id', courseId);
    check('cleanup', remaining === 0, `courses rows after cleanup=${remaining}`);
  } else {
    console.log(`\n  KEEP_COURSE=1 — course ${courseId} retained for manual inspection`);
    console.log(`  Course page: ${ROUTE}/lms/courses/${courseId}`);
    console.log(`  First lesson: ${ROUTE}/lms/courses/${courseId}/lessons/${lms?.[0]?.id}`);
    console.log(`  Checkpoint:   ${ROUTE}/lms/courses/${courseId}/lessons/${checkpoints[0]?.id}`);
    console.log(`  Exam:         ${ROUTE}/lms/courses/${courseId}/lessons/${exams[0]?.id}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log(`SMOKE TEST: ${passed} passed, ${failed} failed`);
  console.log(failed === 0 ? 'RESULT: ✅ PASS' : 'RESULT: ❌ FAIL');
  console.log('══════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
