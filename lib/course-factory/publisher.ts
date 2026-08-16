/**
 * Canonical Course Factory persistence layer.
 *
 * Course Factory owns generation, structural validation, content validation,
 * completeness gating, and publication decisions. This module only persists an
 * already-validated package to courses -> course_modules -> course_lessons.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import type {
  BlueprintModule,
  BlueprintLessonRef,
  BuildMode,
  ValidationResult,
} from './types';
import { inferStepType } from './validator';

export interface PublishInput {
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
  /** Compatibility marker: validation occurs in Course Factory before handoff. */
  validation: ValidationResult;
}

const validatedHandoff: ValidationResult = {
  ok: true,
  valid: true,
  errors: [],
  warnings: [],
  errorCount: 0,
  warningCount: 0,
};

function normalizeLessonContent(
  content: string | undefined,
  objective: string | undefined,
): Record<string, unknown> | null {
  if (!content?.trim()) return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Blueprint-authored HTML/plain text is normalized below.
  }

  return {
    html: content,
    learning_points: objective?.trim() ? [objective.trim()] : [],
    scenario: '',
  };
}

async function upsertCourse(
  db: SupabaseClient,
  slug: string,
  title: string,
  programId: string,
): Promise<string> {
  const { data: existing } = await db
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await db
      .from('courses')
      .update({
        title,
        program_id: programId,
        status: 'draft',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) throw new Error(`Failed to stage course update: ${error.message}`);
    return existing.id;
  }

  const { data: newCourse, error } = await db
    .from('courses')
    .insert({
      slug,
      title,
      program_id: programId,
      status: 'draft',
      is_active: false,
    })
    .select('id')
    .maybeSingle();

  if (error || !newCourse) {
    throw new Error(`Failed to create course: ${error?.message ?? 'unknown database error'}`);
  }

  return newCourse.id;
}

async function upsertModule(
  db: SupabaseClient,
  courseId: string,
  courseModule: BlueprintModule,
): Promise<string | null> {
  const { data: existing } = await db
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', courseModule.slug)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await db
      .from('course_modules')
      .update({
        title: courseModule.title,
        description: courseModule.description,
        order_index: courseModule.orderIndex,
      })
      .eq('id', existing.id);

    if (error) {
      logger.error('[course-factory/publisher] Module update failed', {
        module: courseModule.slug,
        error,
      });
      return null;
    }
    return existing.id;
  }

  const { data: newModule, error } = await db
    .from('course_modules')
    .insert({
      course_id: courseId,
      slug: courseModule.slug,
      title: courseModule.title,
      description: courseModule.description,
      order_index: courseModule.orderIndex,
    })
    .select('id')
    .maybeSingle();

  if (error || !newModule) {
    logger.error('[course-factory/publisher] Module insert failed', {
      module: courseModule.slug,
      error,
    });
    return null;
  }

  return newModule.id;
}

async function upsertLesson(
  db: SupabaseClient,
  courseId: string,
  moduleId: string,
  lesson: BlueprintLessonRef,
): Promise<boolean> {
  const stepType = inferStepType(lesson.slug);
  const quizQuestions =
    lesson.quizQuestions?.map((question) => ({
      question: question.question,
      options: question.options,
      correct: question.correctAnswer,
      explanation: question.explanation,
    })) ?? null;

  const { data: existing } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', lesson.slug)
    .maybeSingle();

  const lessonData = {
    course_id: courseId,
    module_id: moduleId,
    slug: lesson.slug,
    title: lesson.title,
    lesson_type: stepType,
    order_index: lesson.order,
    objective: lesson.objective ?? null,
    content: normalizeLessonContent(lesson.content, lesson.objective),
    quiz_questions: quizQuestions,
    passing_score: lesson.passingScore ?? (stepType === 'exam' ? 80 : 70),
    activities: null,
    status: 'draft',
    is_published: false,
  };

  if (existing?.id) {
    const { error } = await db
      .from('course_lessons')
      .update(lessonData)
      .eq('id', existing.id);

    if (error) {
      logger.error('[course-factory/publisher] Lesson update failed', {
        lesson: lesson.slug,
        error,
      });
      return false;
    }
    return true;
  }

  const { error } = await db.from('course_lessons').insert(lessonData);
  if (error) {
    logger.error('[course-factory/publisher] Lesson insert failed', {
      lesson: lesson.slug,
      error,
    });
    return false;
  }

  return true;
}

/**
 * Persist an already-validated course package as a complete draft.
 * Publication is a separate atomic operation after completeness checks pass.
 */
export async function publishCourse(input: PublishInput): Promise<PublishResult> {
  const db = await requireAdminClient();
  const warnings: string[] = [];
  const errors: string[] = [];

  let courseId: string;
  try {
    courseId = await upsertCourse(db, input.courseSlug, input.courseTitle, input.programId);
  } catch (error) {
    return {
      success: false,
      courseId: '',
      moduleCount: 0,
      lessonCount: 0,
      skippedCount: 0,
      warnings,
      errors: [
        `Course upsert failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
      validation: validatedHandoff,
    };
  }

  if (input.mode === 'replace') {
    const { error: lessonDeleteError } = await db
      .from('course_lessons')
      .delete()
      .eq('course_id', courseId);
    if (lessonDeleteError) {
      return {
        success: false,
        courseId,
        moduleCount: 0,
        lessonCount: 0,
        skippedCount: 0,
        warnings,
        errors: [`Failed to clear existing course lessons: ${lessonDeleteError.message}`],
        validation: validatedHandoff,
      };
    }

    const { error: moduleDeleteError } = await db
      .from('course_modules')
      .delete()
      .eq('course_id', courseId);
    if (moduleDeleteError) {
      return {
        success: false,
        courseId,
        moduleCount: 0,
        lessonCount: 0,
        skippedCount: 0,
        warnings,
        errors: [`Failed to clear existing course modules: ${moduleDeleteError.message}`],
        validation: validatedHandoff,
      };
    }

    logger.info('[course-factory/publisher] Replace mode cleared canonical course package');
  }

  const existingSlugs = new Set<string>();
  if (input.mode === 'missing-only') {
    const { data: existing, error } = await db
      .from('course_lessons')
      .select('slug')
      .eq('course_id', courseId);

    if (error) {
      return {
        success: false,
        courseId,
        moduleCount: 0,
        lessonCount: 0,
        skippedCount: 0,
        warnings,
        errors: [`Failed to load existing course lessons: ${error.message}`],
        validation: validatedHandoff,
      };
    }

    for (const row of existing ?? []) {
      if (row.slug) existingSlugs.add(row.slug);
    }
  }

  let moduleCount = 0;
  let lessonCount = 0;
  let skippedCount = 0;
  const sortedModules = [...input.blueprint].sort(
    (left, right) => left.orderIndex - right.orderIndex,
  );

  for (const courseModule of sortedModules) {
    const moduleId = await upsertModule(db, courseId, courseModule);
    if (!moduleId) {
      errors.push(`Module '${courseModule.slug}' failed to upsert`);
      continue;
    }
    moduleCount += 1;

    const sortedLessons = [...(courseModule.lessons ?? [])].sort(
      (left, right) => left.order - right.order,
    );

    for (const lesson of sortedLessons) {
      if (input.mode === 'missing-only' && existingSlugs.has(lesson.slug)) {
        skippedCount += 1;
        continue;
      }

      const persisted = await upsertLesson(db, courseId, moduleId, lesson);
      if (persisted) lessonCount += 1;
      else errors.push(`Lesson '${lesson.slug}' failed to upsert`);
    }
  }

  return {
    success: errors.length === 0,
    courseId,
    moduleCount,
    lessonCount,
    skippedCount,
    warnings,
    errors,
    validation: validatedHandoff,
  };
}

/**
 * Promote a complete staged course through the database's atomic publication RPC.
 */
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
