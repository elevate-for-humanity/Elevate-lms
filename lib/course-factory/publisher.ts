/**
 * Canonical Course Factory persistence.
 *
 * Writes only to courses → course_modules → course_lessons.
 * Factory persistence creates/updates DRAFT authoring content; learner publication is
 * handled separately by the reviewed version-publish gate.
 */
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import type { BlueprintModule, BlueprintLessonRef, BuildMode, ValidationResult } from './types';

export interface PublishInput {
  /** Exact course target. When present, persistence must not create a parallel course. */
  courseId?: string;
  programId: string;
  courseSlug: string;
  courseTitle: string;
  blueprint: BlueprintModule[];
  mode: BuildMode;
  contentSource?: 'blueprint' | 'curriculum_lessons';
  videoConfig?: { enabled: boolean };
}

export interface PublishResult {
  success: boolean;
  courseId: string;
  moduleCount: number;
  lessonCount: number;
  skippedCount: number;
  warnings: string[];
  errors: string[];
  validation: ValidationResult;
}

function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug.toLowerCase());
}

function inferStepType(lesson: BlueprintLessonRef): string {
  const explicit = String((lesson as any).stepType ?? (lesson as any).type ?? '').toLowerCase();
  if (explicit) return explicit;
  const lower = lesson.slug.toLowerCase();
  if (lower.includes('checkpoint') || lower.includes('quiz')) return 'checkpoint';
  if (lower.includes('exam') || lower.includes('final')) return 'exam';
  if (lower.includes('lab')) return 'lab';
  if (lower.includes('assignment')) return 'assignment';
  return 'lesson';
}

function validateBlueprint(blueprint: BlueprintModule[]): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];
  for (const module of blueprint) {
    if (!module.slug) {
      errors.push({ type: 'error', module: module.title, field: 'slug', message: 'Module slug is required' });
      continue;
    }
    if (!validateSlug(module.slug)) {
      errors.push({ type: 'error', module: module.title, field: 'slug', message: 'Invalid module slug format' });
    }
    for (const lesson of module.lessons ?? []) {
      if (!lesson.slug) {
        errors.push({ type: 'error', module: module.title, field: 'slug', message: 'Lesson slug is required' });
        continue;
      }
      if (!validateSlug(lesson.slug)) {
        errors.push({ type: 'error', module: module.title, lesson: lesson.slug, field: 'slug', message: 'Invalid lesson slug format' });
      }
      const stepType = inferStepType(lesson);
      if (stepType !== 'exam' && (!lesson.content || lesson.content.trim().length < 100)) {
        warnings.push({ type: 'warning', module: module.title, lesson: lesson.slug, field: 'content', message: 'Instructional content is shorter than 100 characters' });
      }
    }
  }
  return {
    ok: errors.length === 0,
    valid: errors.length === 0,
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length,
  };
}

async function resolveCourse(
  db: SupabaseClient,
  input: Pick<PublishInput, 'courseId' | 'courseSlug' | 'courseTitle' | 'programId'>,
): Promise<string> {
  const now = new Date().toISOString();

  if (input.courseId) {
    const { data: exact, error } = await db.from('courses').select('id').eq('id', input.courseId).maybeSingle();
    if (error) throw error;
    if (!exact) throw new Error(`Target course ${input.courseId} not found`);
    const { error: updateError } = await db.from('courses').update({
      title: input.courseTitle,
      program_id: input.programId,
      updated_at: now,
    }).eq('id', input.courseId);
    if (updateError) throw updateError;
    return input.courseId;
  }

  const { data: existing, error: lookupError } = await db.from('courses').select('id').eq('slug', input.courseSlug).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing?.id) {
    const { error } = await db.from('courses').update({
      title: input.courseTitle,
      program_id: input.programId,
      updated_at: now,
    }).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data: created, error } = await db.from('courses').insert({
    slug: input.courseSlug,
    course_slug: input.courseSlug,
    title: input.courseTitle,
    course_name: input.courseTitle,
    program_id: input.programId,
    status: 'draft',
    review_status: 'draft',
    is_active: false,
    generation_status: 'draft',
  }).select('id').single();
  if (error || !created) throw new Error(`Failed to create course: ${error?.message ?? 'unknown error'}`);
  return created.id;
}

async function upsertModule(
  db: SupabaseClient,
  courseId: string,
  module: BlueprintModule,
): Promise<string> {
  const orderIndex = Number((module as any).orderIndex ?? (module as any).order ?? 0);
  const { data: existing, error: lookupError } = await db
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', module.slug)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const payload = {
    course_id: courseId,
    slug: module.slug,
    title: module.title,
    description: module.description ?? null,
    order_index: orderIndex,
    order: orderIndex,
    domain_key: (module as any).domainKey ?? null,
    target_hours: (module as any).targetHours ?? null,
    is_published: false,
    is_draft: true,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await db.from('course_modules').update(payload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data: created, error } = await db.from('course_modules').insert(payload).select('id').single();
  if (error || !created) throw new Error(`Failed to create module '${module.slug}': ${error?.message ?? 'unknown error'}`);
  return created.id;
}

async function upsertLesson(
  db: SupabaseClient,
  courseId: string,
  moduleId: string,
  lesson: BlueprintLessonRef,
): Promise<void> {
  const stepType = inferStepType(lesson);
  const quizQuestions = lesson.quizQuestions?.map((question) => ({
    question: question.question,
    options: question.options,
    correct: question.correctAnswer,
    explanation: question.explanation,
  })) ?? null;
  const orderIndex = Number((lesson as any).orderIndex ?? lesson.order ?? 0);
  const objectives = Array.isArray((lesson as any).learningObjectives) && (lesson as any).learningObjectives.length
    ? (lesson as any).learningObjectives
    : lesson.objective
      ? [lesson.objective]
      : [];
  const contentJson = (lesson as any).contentJson ?? (lesson as any).content_json ?? {};

  const payload = {
    course_id: courseId,
    module_id: moduleId,
    slug: lesson.slug,
    title: lesson.title,
    lesson_type: stepType,
    order_index: orderIndex,
    content: lesson.content ?? null,
    rendered_html: (lesson as any).renderedHtml ?? (typeof lesson.content === 'string' ? lesson.content : null),
    learning_objectives: objectives,
    quiz_questions: quizQuestions,
    passing_score: lesson.passingScore ?? (stepType === 'exam' ? 75 : ['checkpoint', 'quiz'].includes(stepType) ? 70 : null),
    duration_minutes: (lesson as any).durationMinutes ?? null,
    minimum_seat_time_minutes: (lesson as any).minimumSeatTimeMinutes ?? (lesson as any).durationMinutes ?? null,
    domain_key: (lesson as any).domainKey ?? null,
    practical_required: Boolean((lesson as any).practicalRequired ?? stepType === 'lab'),
    requires_instructor_signoff: Boolean((lesson as any).requiresInstructorSignoff ?? stepType === 'lab'),
    competency_checks: (lesson as any).competencyChecks ?? [],
    required_skill_id: (lesson as any).requiredSkillId ?? null,
    hour_category: (lesson as any).hourCategory ?? null,
    delivery_method: (lesson as any).deliveryMethod ?? null,
    content_json: contentJson,
    status: 'draft',
    is_published: false,
    approved: false,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: lookupError } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', lesson.slug)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing?.id) {
    const { error } = await db.from('course_lessons').update(payload).eq('id', existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await db.from('course_lessons').insert(payload);
  if (error) throw error;
}

/**
 * Persist a generated/blueprint course as authoring draft content.
 * Replace mode is non-destructive: existing rows absent from the new blueprint are unpublished,
 * not deleted, so learner progress foreign keys remain intact.
 */
export async function publishCourse(input: PublishInput): Promise<PublishResult> {
  const db = await requireAdminClient();
  const warnings: string[] = [];
  const errors: string[] = [];
  const validation = validateBlueprint(input.blueprint);
  if (!validation.valid) {
    return {
      success: false,
      courseId: input.courseId ?? '',
      moduleCount: 0,
      lessonCount: 0,
      skippedCount: 0,
      warnings,
      errors: validation.errors.map((error) => `${error.lesson || error.module || 'course'}: ${error.message}`),
      validation,
    };
  }
  warnings.push(...validation.warnings.map((warning) => `Warning: ${warning.lesson || warning.module || 'course'}: ${warning.message}`));

  let courseId = '';
  try {
    courseId = await resolveCourse(db, input);
  } catch (error) {
    return {
      success: false,
      courseId: input.courseId ?? '',
      moduleCount: 0,
      lessonCount: 0,
      skippedCount: 0,
      warnings,
      errors: [`Course resolution failed: ${error instanceof Error ? error.message : String(error)}`],
      validation,
    };
  }

  const blueprintModuleSlugs = input.blueprint.map((module) => module.slug);
  const blueprintLessonSlugs = input.blueprint.flatMap((module) => (module.lessons ?? []).map((lesson) => lesson.slug));

  if (input.mode === 'replace') {
    let oldLessons = db.from('course_lessons').update({ status: 'draft', is_published: false, approved: false, updated_at: new Date().toISOString() }).eq('course_id', courseId);
    if (blueprintLessonSlugs.length) oldLessons = oldLessons.not('slug', 'in', `(${blueprintLessonSlugs.map((slug) => `"${slug}"`).join(',')})`);
    const { error: oldLessonError } = await oldLessons;
    if (oldLessonError) warnings.push(`Could not unpublish superseded lessons: ${oldLessonError.message}`);

    let oldModules = db.from('course_modules').update({ is_published: false, is_draft: true, updated_at: new Date().toISOString() }).eq('course_id', courseId);
    if (blueprintModuleSlugs.length) oldModules = oldModules.not('slug', 'in', `(${blueprintModuleSlugs.map((slug) => `"${slug}"`).join(',')})`);
    const { error: oldModuleError } = await oldModules;
    if (oldModuleError) warnings.push(`Could not unpublish superseded modules: ${oldModuleError.message}`);
  }

  const existingSlugs = new Set<string>();
  if (input.mode === 'missing-only') {
    const { data, error } = await db.from('course_lessons').select('slug').eq('course_id', courseId);
    if (error) throw error;
    for (const row of data ?? []) if (row.slug) existingSlugs.add(row.slug);
  }

  let moduleCount = 0;
  let lessonCount = 0;
  let skippedCount = 0;
  const sortedModules = [...input.blueprint].sort((a, b) => Number((a as any).orderIndex ?? (a as any).order ?? 0) - Number((b as any).orderIndex ?? (b as any).order ?? 0));

  for (const module of sortedModules) {
    try {
      const moduleId = await upsertModule(db, courseId, module);
      moduleCount += 1;
      const sortedLessons = [...(module.lessons ?? [])].sort((a, b) => Number((a as any).orderIndex ?? a.order ?? 0) - Number((b as any).orderIndex ?? b.order ?? 0));
      for (const lesson of sortedLessons) {
        if (input.mode === 'missing-only' && existingSlugs.has(lesson.slug)) {
          skippedCount += 1;
          continue;
        }
        try {
          await upsertLesson(db, courseId, moduleId, lesson);
          lessonCount += 1;
        } catch (error) {
          errors.push(`Lesson '${lesson.slug}' failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      errors.push(`Module '${module.slug}' failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const { error: courseStateError } = await db.from('courses').update({
    status: 'draft',
    review_status: 'draft',
    is_active: false,
    updated_at: new Date().toISOString(),
  }).eq('id', courseId);
  if (courseStateError) errors.push(`Failed to enforce draft course state: ${courseStateError.message}`);

  return {
    success: errors.length === 0,
    courseId,
    moduleCount,
    lessonCount,
    skippedCount,
    warnings,
    errors,
    validation,
  };
}

/** Atomic publish RPC retained for callers that explicitly use the database staging pipeline. */
export async function publishCourseAtomic(
  courseId: string,
  programId?: string | null,
): Promise<{ success: boolean; lessonsPublished?: number; error?: string }> {
  const db = await requireAdminClient();
  const { data, error } = await db.rpc('publish_course_from_staging', {
    p_course_id: courseId,
    p_program_id: programId && programId !== courseId ? programId : null,
  });
  if (error) return { success: false, error: error.message };
  return {
    success: true,
    lessonsPublished: (data as { lessons_published?: number })?.lessons_published,
  };
}
