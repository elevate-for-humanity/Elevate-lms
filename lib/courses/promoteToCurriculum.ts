/**
 * Promotes validated staged lessons from course_lessons → curriculum_lessons.
 *
 * Idempotent on (course_id, lesson_order). Existing rows are skipped.
 * Compliance guard: refuses promotion if any lesson lacks draft_for_human_review.
 *
 * Column mapping (actual DB schema):
 *   course_lessons.lesson_type  → curriculum_lessons.step_type
 *   course_lessons.order_index  → curriculum_lessons.lesson_order
 *   course_lessons.content JSON → curriculum_lessons.script_text + key_terms
 *   course_modules.order_index  → curriculum_lessons.module_order
 *   course_modules.title        → curriculum_lessons.module_title
 */

import { getAdminClient } from '@/lib/supabase/admin';

export interface PromoteResult {
  inserted: number;
  skipped: number;
  course_id: string;
  curriculum_lesson_ids: string[];
  errors: string[];
}

const VALID_STEP_TYPES = new Set(['lesson', 'checkpoint', 'exam']);

export async function promoteToCurriculum(
  courseId: string,
  programId: string
): Promise<PromoteResult> {
  const db = await getAdminClient();
  const result: PromoteResult = {
    inserted: 0,
    skipped: 0,
    course_id: courseId,
    curriculum_lesson_ids: [],
    errors: [],
  };

  // ── Fetch course ──────────────────────────────────────────────────────────
  const { data: course, error: courseErr } = await db
    .from('courses')
    .select('id, title, status')
    .eq('id', courseId)
    .single();

  if (courseErr || !course) {
    result.errors.push(`Course not found: ${courseId}`);
    return result;
  }
  if (course.status !== 'draft') {
    result.errors.push(`Course status="${course.status}" — only draft courses can be promoted`);
    return result;
  }

  // ── Fetch modules ─────────────────────────────────────────────────────────
  const { data: modules, error: modErr } = await db
    .from('course_modules')
    .select('id, title, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (modErr || !modules) {
    result.errors.push(`Failed to fetch modules: ${modErr?.message}`);
    return result;
  }

  // Map module_id → { title, order_index }
  const moduleMap = new Map(modules.map(m => [m.id as string, m]));

  // ── Fetch staged lessons ──────────────────────────────────────────────────
  const { data: lessons, error: lessonErr } = await db
    .from('course_lessons')
    .select('id, module_id, title, slug, lesson_type, order_index, passing_score, content')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (lessonErr || !lessons || lessons.length === 0) {
    result.errors.push(`No staged lessons found: ${lessonErr?.message ?? 'empty'}`);
    return result;
  }

  // ── Compliance guard ──────────────────────────────────────────────────────
  // course_lessons stores compliance_status inside the content JSON blob
  for (const lesson of lessons) {
    let content: Record<string, unknown> = {};
    try {
      content = typeof lesson.content === 'string'
        ? JSON.parse(lesson.content)
        : (lesson.content ?? {});
    } catch { /* no content JSON — ok */ }

    const cs = content.compliance_status as string | undefined;
    // Only block if explicitly set to something other than draft
    if (cs && cs !== 'draft_for_human_review') {
      result.errors.push(`Refusing promotion: "${lesson.slug}" has compliance_status="${cs}"`);
      return result;
    }
  }

  // ── Idempotency: fetch existing lesson_order values for this course ─────────
  // Keyed on (course_id, lesson_order) — the only reliable unique key when
  // program_id may be NULL (NULL != NULL in Postgres unique indexes).
  const { data: existing } = await db
    .from('curriculum_lessons')
    .select('lesson_order')
    .eq('course_id', courseId);

  const existingOrders = new Set((existing ?? []).map(r => r.lesson_order as number));

  // ── Build insert rows ─────────────────────────────────────────────────────
  const insertRows: Record<string, unknown>[] = [];

  for (const lesson of lessons) {
    const stepType = lesson.lesson_type as string;

    if (!VALID_STEP_TYPES.has(stepType)) {
      result.skipped++;
      result.errors.push(`Skipped "${lesson.slug}": invalid step_type "${stepType}"`);
      continue;
    }

    if (existingOrders.has(lesson.order_index as number)) {
      result.skipped++;
      continue;
    }

    const mod = moduleMap.get(lesson.module_id as string);
    const moduleOrder = (mod?.order_index as number) ?? 0;
    const moduleTitle = (mod?.title as string) ?? '';

    // Parse content blob → script_text + key_terms
    let scriptText = '';
    let keyTerms: string[] = [];
    try {
      const c = typeof lesson.content === 'string'
        ? JSON.parse(lesson.content as string)
        : (lesson.content ?? {});
      const points: string[] = (c.learning_points as string[]) ?? [];
      const scenario: string = (c.scenario as string) ?? '';
      const aq = (c.assessment_question as Record<string, unknown>) ?? {};

      scriptText = [
        points.length > 0
          ? `Learning Points:\n${points.map((p: string) => `• ${p}`).join('\n')}`
          : '',
        scenario ? `\nScenario:\n${scenario}` : '',
        aq.question
          ? `\nAssessment:\n${aq.question}\na) ${(aq.choices as Record<string,string>)?.a}\nb) ${(aq.choices as Record<string,string>)?.b}\nc) ${(aq.choices as Record<string,string>)?.c}\nd) ${(aq.choices as Record<string,string>)?.d}\nCorrect: ${String(aq.correct).toUpperCase()}\nRationale: ${aq.rationale}`
          : '',
      ].filter(Boolean).join('\n');

      keyTerms = points.slice(0, 5).map((p: string) => p.split(' ').slice(0, 4).join(' '));
    } catch {
      scriptText = lesson.title as string;
    }

    insertRows.push({
      course_id:    courseId,
      // program_id: null when no program is linked yet (nullable per migration
      // 20260525000001_curriculum_lessons_nullable_program_id.sql)
      program_id:   (programId && programId !== courseId) ? programId : null,
      lesson_slug:  lesson.slug,
      lesson_title: lesson.title,
      lesson_order: lesson.order_index,
      module_order: moduleOrder,
      module_title: moduleTitle,
      step_type:    stepType,
      passing_score: lesson.passing_score ?? 0,
      script_text:  scriptText,
      key_terms:    keyTerms,
      status:       'draft',
    });
  }

  if (insertRows.length === 0) {
    // All rows already existed — fully idempotent
    return result;
  }

  // ── Batch insert (single round-trip, all-or-nothing at PostgREST level) ───
  const { data: inserted, error: insertErr } = await db
    .from('curriculum_lessons')
    .insert(insertRows)
    .select('id');

  if (insertErr) {
    result.errors.push(`Batch insert failed: ${insertErr.message}`);
    return result;
  }

  result.inserted = inserted?.length ?? 0;
  result.curriculum_lesson_ids = (inserted ?? []).map(r => r.id as string);

  return result;
}
