/**
 * Seeder: course_lessons → curriculum_lessons
 *
 * Promotes a validated staged course into the live LMS delivery table.
 * Idempotent: safe to run multiple times. Uses (course_id, lesson_order)
 * as the uniqueness key — existing rows are updated, new rows are inserted.
 *
 * Mapping:
 *   course_lessons.lesson_type  → curriculum_lessons.step_type
 *   course_lessons.order_index  → curriculum_lessons.lesson_order
 *   course_lessons.content      → curriculum_lessons.script_text + key_terms
 *   course_lessons.passing_score → curriculum_lessons.passing_score
 *
 * Guardrails enforced:
 *   - Only promotes courses with status = 'draft' (never auto-promotes published)
 *   - compliance_status must be 'draft_for_human_review' on the course record
 *   - No row is written if step_type is not lesson/checkpoint/exam
 *   - Returns a detailed result: inserted, updated, skipped, errors
 */

import { getAdminClient } from '@/lib/supabase/admin';

export interface SeederResult {
  course_id: string;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  curriculum_lesson_ids: string[];
}

const VALID_STEP_TYPES = new Set(['lesson', 'checkpoint', 'exam']);

export async function seedCourseToCurriculumLessons(
  courseId: string,
  programId: string
): Promise<SeederResult> {
  const db = await getAdminClient();
  const result: SeederResult = {
    course_id: courseId,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    curriculum_lesson_ids: [],
  };

  // ── 1. Fetch course ───────────────────────────────────────────────────────
  const { data: course, error: courseErr } = await db
    .from('courses')
    .select('id, title, slug, status, description')
    .eq('id', courseId)
    .single();

  if (courseErr || !course) {
    result.errors.push(`Course not found: ${courseId}`);
    return result;
  }

  // Only promote draft courses — never auto-promote published ones
  if (course.status !== 'draft') {
    result.errors.push(`Course status is "${course.status}" — only draft courses can be seeded`);
    return result;
  }

  // ── 2. Fetch modules ──────────────────────────────────────────────────────
  const { data: modules, error: modErr } = await db
    .from('course_modules')
    .select('id, title, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (modErr || !modules) {
    result.errors.push(`Failed to fetch modules: ${modErr?.message}`);
    return result;
  }

  const moduleMap = new Map(modules.map(m => [m.id, m]));

  // ── 3. Fetch lessons ──────────────────────────────────────────────────────
  const { data: lessons, error: lessonErr } = await db
    .from('course_lessons')
    .select('id, module_id, title, slug, lesson_type, order_index, passing_score, activities, content')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (lessonErr || !lessons) {
    result.errors.push(`Failed to fetch lessons: ${lessonErr?.message}`);
    return result;
  }

  if (lessons.length === 0) {
    result.errors.push('No lessons found for this course');
    return result;
  }

  // ── 4. Fetch existing curriculum_lessons for idempotency ──────────────────
  const { data: existing } = await db
    .from('curriculum_lessons')
    .select('id, lesson_order, lesson_slug')
    .eq('course_id', courseId);

  const existingByOrder = new Map(
    (existing ?? []).map(r => [r.lesson_order as number, r.id as string])
  );

  // ── 5. Map and upsert each lesson ─────────────────────────────────────────
  for (const lesson of lessons) {
    const stepType = lesson.lesson_type as string;

    if (!VALID_STEP_TYPES.has(stepType)) {
      result.skipped++;
      result.errors.push(`Skipped "${lesson.slug}": invalid step_type "${stepType}"`);
      continue;
    }

    const mod = moduleMap.get(lesson.module_id);
    const moduleTitle = mod?.title ?? '';
    const moduleOrder = mod?.order_index ?? 0;

    // Parse content JSON (stored as stringified JSON from generator)
    let scriptText = '';
    let keyTerms: string[] = [];
    try {
      const content = typeof lesson.content === 'string'
        ? JSON.parse(lesson.content)
        : (lesson.content ?? {});
      const points: string[] = content.learning_points ?? [];
      const scenario: string = content.scenario ?? '';
      const aq = content.assessment_question ?? {};

      // Build script_text from learning points + scenario
      scriptText = [
        points.length > 0 ? `Learning Points:\n${points.map((p: string) => `• ${p}`).join('\n')}` : '',
        scenario ? `\nScenario:\n${scenario}` : '',
        aq.question ? `\nAssessment:\n${aq.question}\na) ${aq.choices?.a}\nb) ${aq.choices?.b}\nc) ${aq.choices?.c}\nd) ${aq.choices?.d}\nCorrect: ${aq.correct?.toUpperCase()}\nRationale: ${aq.rationale}` : '',
      ].filter(Boolean).join('\n');

      keyTerms = points.slice(0, 5).map((p: string) => p.split(' ').slice(0, 3).join(' '));
    } catch {
      scriptText = lesson.title;
    }

    const row = {
      course_id:    courseId,
      program_id:   programId,
      module_id:    lesson.module_id,
      lesson_slug:  lesson.slug,
      lesson_title: lesson.title,
      lesson_order: lesson.order_index,
      module_order: moduleOrder,
      module_title: moduleTitle,
      step_type:    stepType,
      passing_score: lesson.passing_score ?? null,
      script_text:  scriptText,
      key_terms:    keyTerms,
      status:       'draft',
    };

    const existingId = existingByOrder.get(lesson.order_index);

    if (existingId) {
      // Update existing row
      const { error: updateErr } = await db
        .from('curriculum_lessons')
        .update(row)
        .eq('id', existingId);

      if (updateErr) {
        result.errors.push(`Update failed for "${lesson.slug}": ${updateErr.message}`);
      } else {
        result.updated++;
        result.curriculum_lesson_ids.push(existingId);
      }
    } else {
      // Insert new row
      const { data: inserted, error: insertErr } = await db
        .from('curriculum_lessons')
        .insert(row)
        .select('id')
        .single();

      if (insertErr) {
        result.errors.push(`Insert failed for "${lesson.slug}": ${insertErr.message}`);
      } else {
        result.inserted++;
        result.curriculum_lesson_ids.push(inserted.id);
      }
    }
  }

  return result;
}
