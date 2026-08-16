/**
 * Canonical Course Factory persistence layer.
 *
 * Course Factory owns generation, structural validation, content validation,
 * completeness gating, and publication decisions. This module persists an
 * already-validated package through ONE PostgreSQL transaction boundary.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import type { BlueprintModule, BuildMode, ValidationResult } from './types';
import { inferStepType } from './validator';

export interface PublishInput {
  programId?: string | null;
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

function buildAtomicPayload(modules: BlueprintModule[]) {
  return [...modules]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((courseModule) => ({
      slug: courseModule.slug,
      title: courseModule.title,
      description: courseModule.description ?? null,
      order_index: courseModule.orderIndex,
      lessons: [...(courseModule.lessons ?? [])]
        .sort((left, right) => left.order - right.order)
        .map((lesson) => {
          const stepType = inferStepType(lesson.slug);
          return {
            slug: lesson.slug,
            title: lesson.title,
            lesson_type: stepType,
            order_index: lesson.order,
            objective: lesson.objective ?? null,
            content: normalizeLessonContent(lesson.content, lesson.objective),
            quiz_questions:
              lesson.quizQuestions?.map((question) => ({
                question: question.question,
                options: question.options,
                correct: question.correctAnswer,
                explanation: question.explanation,
              })) ?? null,
            passing_score: lesson.passingScore ?? (stepType === 'exam' ? 80 : 70),
            activities: lesson.activities ?? null,
          };
        }),
    }));
}

/**
 * Persist an already-validated course package as a complete draft.
 *
 * The database function is atomic: replace-mode deletion and recreation occur
 * in a single PostgreSQL transaction. Any error rolls back the whole package,
 * leaving the previously valid course intact.
 */
export async function publishCourse(input: PublishInput): Promise<PublishResult> {
  const db = await requireAdminClient();
  const modules = buildAtomicPayload(input.blueprint);

  try {
    // Generated Supabase types may lag the migration by one generation cycle.
    // Runtime RPC contract is enforced by the database migration.
    const { data, error } = await (db as any).rpc('publish_course_package_atomic', {
      p_program_id: input.programId ?? null,
      p_course_slug: input.courseSlug,
      p_course_title: input.courseTitle,
      p_mode: input.mode,
      p_modules: modules,
    });

    if (error) {
      return {
        success: false,
        courseId: '',
        moduleCount: 0,
        lessonCount: 0,
        skippedCount: 0,
        warnings: [],
        errors: [`Atomic course persistence failed: ${error.message}`],
        validation: validatedHandoff,
      };
    }

    const result = (data ?? {}) as {
      success?: boolean;
      course_id?: string;
      module_count?: number;
      lesson_count?: number;
      skipped_count?: number;
    };

    return {
      success: result.success === true,
      courseId: result.course_id ?? '',
      moduleCount: Number(result.module_count ?? 0),
      lessonCount: Number(result.lesson_count ?? 0),
      skippedCount: Number(result.skipped_count ?? 0),
      warnings: [],
      errors: result.success === true ? [] : ['Atomic course persistence did not report success'],
      validation: validatedHandoff,
    };
  } catch (error) {
    return {
      success: false,
      courseId: '',
      moduleCount: 0,
      lessonCount: 0,
      skippedCount: 0,
      warnings: [],
      errors: [
        `Atomic course persistence failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
      validation: validatedHandoff,
    };
  }
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
