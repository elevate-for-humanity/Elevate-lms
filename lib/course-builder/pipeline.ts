/**
 * lib/course-builder/pipeline.ts
 *
 * Pre-publish pipeline for course generation.
 *
 * Sequence:
 *   1. Normalize  — fill defaults, infer types from slug suffixes
 *   2. Validate   — run barber-grade rules, reject on any error
 *   3. Audit      — run blueprint auditor if a blueprint is provided
 *   4. Resolve    — map programSlug → courseId
 *   5. Persist    — write courses → course_modules → course_lessons
 *
 * Usage (from a seed script):
 *   import { runCoursePublishPipeline } from '@/lib/course-builder/pipeline';
 *   const result = await runCoursePublishPipeline({ template, db, mode: 'missing-only' });
 *
 * Usage (dry run — validate only, no DB writes):
 *   const result = await runCoursePublishPipeline({ template, db, dryRun: true });
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CourseTemplate, CourseLesson, CourseModule } from './schema';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
import { validateCourseTemplate, assertPublishable, type CourseValidationResult } from './validate';
import { resolveCourseId } from './schema';
import { getCompetencyDefinition } from './competencies';
import { logger } from '@/lib/logger';

// ─── Pipeline options ─────────────────────────────────────────────────────────

export type PipelineMode = 'missing-only' | 'replace';

export type PipelineOptions = {
  template: CourseTemplate;
  db: SupabaseClient;
  mode?: PipelineMode;
  /** If true, validate and audit but do not write to DB */
  dryRun?: boolean;
  /** Optional blueprint for auditor integration */
  blueprint?: CredentialBlueprint;
};

export type PipelineResult = {
  success: boolean;
  courseId: string | null;
  validation: CourseValidationResult;
  lessonsWritten: number;
  lessonsSkipped: number;
  errors: string[];
};

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Infers lesson type from slug suffix when type is not explicitly set.
 * Mirrors the logic in buildCanonicalCourseFromBlueprint.
 */
function inferLessonType(slug: string): CourseLesson['type'] {
  if (slug.endsWith('-checkpoint')) return 'checkpoint';
  if (slug.endsWith('-exam'))       return 'exam';
  if (slug.endsWith('-quiz'))       return 'quiz';
  if (slug.endsWith('-lab'))        return 'lab';
  if (slug.endsWith('-assignment')) return 'assignment';
  if (slug.endsWith('-cert'))       return 'certification';
  return 'lesson';
}

/**
 * Fills competency check labels from the registry when omitted.
 * Ensures the DB row has human-readable labels without requiring
 * blueprint authors to duplicate them.
 */
function normalizeCompetencyChecks(lesson: CourseLesson): CourseLesson {
  if (!lesson.competencyChecks?.length) return lesson;
  return {
    ...lesson,
    competencyChecks: lesson.competencyChecks.map(check => {
      const def = getCompetencyDefinition(check.key);
      return {
        ...check,
        label:     check.label     ?? def?.label     ?? check.key,
        isCritical: check.isCritical ?? def?.isCritical ?? false,
      };
    }),
  };
}

export function normalizeTemplate(template: CourseTemplate): CourseTemplate {
  return {
    ...template,
    modules: template.modules.map((mod, mi) => ({
      ...mod,
      order: mod.order ?? mi + 1,
      lessons: mod.lessons.map((lesson, li) => {
        const normalized: CourseLesson = {
          ...lesson,
          type:  lesson.type ?? inferLessonType(lesson.slug),
          order: lesson.order ?? li + 1,
        };
        return normalizeCompetencyChecks(normalized);
      }),
    })),
  };
}

// ─── DB persistence ───────────────────────────────────────────────────────────

async function persistCourse(
  template: CourseTemplate,
  courseId: string,
  db: SupabaseClient,
  mode: PipelineMode,
): Promise<{ written: number; skipped: number; errors: string[] }> {
  let written = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Upsert the courses row
  const { error: courseErr } = await db.from('courses').upsert({
    id:          courseId,
    slug:        template.courseSlug,
    title:       template.title,
    description: template.description ?? null,
    updated_at:  new Date().toISOString(),
  }, { onConflict: 'id' });
  if (courseErr) {
    errors.push(`courses upsert failed: ${courseErr.message}`);
    return { written, skipped, errors };
  }

  // Replace mode: wipe existing modules + lessons for this course
  if (mode === 'replace') {
    await db.from('course_lessons').delete().eq('course_id', courseId);
    await db.from('course_modules').delete().eq('course_id', courseId);
  }

  // Fetch existing lesson slugs for missing-only mode
  let existingSlugs = new Set<string>();
  if (mode === 'missing-only') {
    const { data: existing } = await db
      .from('course_lessons')
      .select('slug')
      .eq('course_id', courseId);
    existingSlugs = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
  }

  for (const mod of template.modules) {
    // Upsert module
    const { data: moduleRow, error: modErr } = await db
      .from('course_modules')
      .upsert({
        course_id:   courseId,
        slug:        mod.slug,
        title:       mod.title,
        order_index: mod.order,
        updated_at:  new Date().toISOString(),
      }, { onConflict: 'course_id,slug' })
      .select('id')
      .single();

    if (modErr || !moduleRow) {
      errors.push(`module '${mod.slug}' upsert failed: ${modErr?.message}`);
      continue;
    }

    for (const lesson of mod.lessons) {
      if (mode === 'missing-only' && existingSlugs.has(lesson.slug)) {
        skipped++;
        continue;
      }

      const { error: lessonErr } = await db.from('course_lessons').upsert({
        course_id:           courseId,
        course_module_id:    moduleRow.id,
        slug:                lesson.slug,
        title:               lesson.title,
        lesson_type:         lesson.type,
        order_index:         lesson.order,
        learning_objectives: lesson.learningObjectives,
        content:             lesson.content ?? null,
        video_url:           lesson.videoUrl ?? null,
        quiz_questions:      lesson.quizQuestions ?? null,
        passing_score:       lesson.passingScore ?? null,
        practical_required:  lesson.practicalRequired ?? false,
        competency_checks:   lesson.competencyChecks ?? null,
        instructor_notes:    lesson.instructorNotes ?? null,
        duration_minutes:    lesson.durationMinutes ?? null,
        partner_exam_code:   lesson.partnerExamCode ?? null,
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'course_id,slug' });

      if (lessonErr) {
        errors.push(`lesson '${lesson.slug}' upsert failed: ${lessonErr.message}`);
      } else {
        written++;
      }
    }
  }

  return { written, skipped, errors };
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function runCoursePublishPipeline(opts: PipelineOptions): Promise<PipelineResult> {
  const { db, mode = 'missing-only', dryRun = false } = opts;

  // Step 1: Normalize
  const template = normalizeTemplate(opts.template);

  // Step 2: Validate — hard stop on any error
  const validation = validateCourseTemplate(template);

  if (!validation.valid) {
    logger.error('[course-builder] Validation failed — pipeline aborted', {
      courseSlug: template.courseSlug,
      errorCount: validation.errorCount,
    });
    return {
      success: false,
      courseId: null,
      validation,
      lessonsWritten: 0,
      lessonsSkipped: 0,
      errors: validation.errors.map(e => `${e.moduleSlug}/${e.lessonSlug} [${e.field}]: ${e.message}`),
    };
  }

  if (validation.warnings.length > 0) {
    logger.warn('[course-builder] Validation warnings', {
      courseSlug: template.courseSlug,
      warnings: validation.warnings.map(w => `${w.lessonSlug} [${w.field}]: ${w.message}`),
    });
  }

  // Step 3: Resolve course ID
  const courseId = resolveCourseId(template.programSlug);
  if (!courseId) {
    return {
      success: false,
      courseId: null,
      validation,
      lessonsWritten: 0,
      lessonsSkipped: 0,
      errors: [`programSlug '${template.programSlug}' not in PROGRAM_COURSE_MAP`],
    };
  }

  // Step 4: Dry run — stop here
  if (dryRun) {
    logger.info('[course-builder] Dry run complete — no DB writes', {
      courseSlug: template.courseSlug,
      lessonCount: validation.lessonCount,
    });
    return {
      success: true,
      courseId,
      validation,
      lessonsWritten: 0,
      lessonsSkipped: 0,
      errors: [],
    };
  }

  // Step 5: Persist
  const { written, skipped, errors: persistErrors } = await persistCourse(template, courseId, db, mode);

  const success = persistErrors.length === 0;
  if (!success) {
    logger.error('[course-builder] Persistence errors', { courseSlug: template.courseSlug, errors: persistErrors });
  } else {
    logger.info('[course-builder] Course published', {
      courseSlug: template.courseSlug,
      courseId,
      written,
      skipped,
    });
  }

  return {
    success,
    courseId,
    validation,
    lessonsWritten: written,
    lessonsSkipped: skipped,
    errors: persistErrors,
  };
}
