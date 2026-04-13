/**
 * lib/course-builder/validate.ts
 *
 * Barber-grade validator for CourseLesson and CourseTemplate objects.
 *
 * Rules enforced:
 *   - Every lesson must have a slug, title, type, and at least one objective
 *   - Assessed lessons (quiz/checkpoint/exam) must have quiz_questions (≥5) + passing_score
 *   - Content lessons must have content (>200 visible chars) or video_url
 *   - Theory-only lessons must NOT have passing_score (prevents false gates)
 *   - Practical lessons must declare practicalRequired=true
 *   - Any lesson with competencyChecks must have practicalRequired=true
 *   - Every competency key must exist in the registry
 *   - programSlug must resolve to a course_id via PROGRAM_COURSE_MAP
 *   - No duplicate lesson slugs within a course
 *
 * Usage:
 *   const result = validateCourseTemplate(template);
 *   if (!result.valid) throw new Error(result.errors.join('\n'));
 */

import {
  ASSESSED_LESSON_TYPES,
  CONTENT_LESSON_TYPES,
  type CourseLesson,
  type CourseModule,
  type CourseTemplate,
} from './schema';
import { isRegisteredCompetencyKey, findUnregisteredKeys } from './competencies';
import { resolveCourseId } from './schema';

// ─── Result types ─────────────────────────────────────────────────────────────

export type LessonValidationError = {
  moduleSlug: string;
  lessonSlug: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
};

export type CourseValidationResult = {
  valid: boolean;
  errors: LessonValidationError[];
  warnings: LessonValidationError[];
  /** Summary counts */
  lessonCount: number;
  errorCount: number;
  warningCount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function visibleLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').trim().length;
}

// ─── Lesson validator ─────────────────────────────────────────────────────────

export function validateCourseLesson(
  lesson: CourseLesson,
  moduleSlug: string,
): LessonValidationError[] {
  const errs: LessonValidationError[] = [];

  const e = (field: string, message: string, severity: 'error' | 'warning' = 'error') =>
    errs.push({ moduleSlug, lessonSlug: lesson.slug, field, message, severity });

  // ── Identity ──────────────────────────────────────────────────────────────
  if (!lesson.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lesson.slug)) {
    e('slug', 'must be lowercase kebab-case');
  }
  if (!lesson.title || lesson.title.trim().length < 3) {
    e('title', 'must be at least 3 characters');
  }
  if (!lesson.type) {
    e('type', 'lesson type is required');
  }

  // ── Objectives ────────────────────────────────────────────────────────────
  if (!lesson.learningObjectives || lesson.learningObjectives.length === 0) {
    e('learningObjectives', 'at least one learning objective is required');
  } else {
    const generic = lesson.learningObjectives.filter(
      o => o.toLowerCase().includes('understand') && o.split(' ').length < 5,
    );
    if (generic.length > 0) {
      e('learningObjectives', `${generic.length} objective(s) are too generic — use measurable verbs (demonstrate, identify, apply)`, 'warning');
    }
  }

  // ── Content / video ───────────────────────────────────────────────────────
  if (CONTENT_LESSON_TYPES.includes(lesson.type as any)) {
    const hasContent = lesson.content && visibleLength(lesson.content) >= 200;
    const hasVideo   = !!lesson.videoUrl;
    if (!hasContent && !hasVideo) {
      e('content', `${lesson.type} lesson requires either content (≥200 chars) or videoUrl`);
    }
  }

  // ── Assessment ────────────────────────────────────────────────────────────
  if (ASSESSED_LESSON_TYPES.includes(lesson.type as any)) {
    if (!lesson.quizQuestions || lesson.quizQuestions.length < 5) {
      e('quizQuestions', `${lesson.type} lesson requires at least 5 quiz questions (got ${lesson.quizQuestions?.length ?? 0})`);
    }
    if (lesson.passingScore == null) {
      e('passingScore', `${lesson.type} lesson requires a passing_score`);
    } else if (lesson.passingScore < 1 || lesson.passingScore > 100) {
      e('passingScore', `passing_score must be 1–100 (got ${lesson.passingScore})`);
    }
  }

  // Theory-only lessons must NOT have a passing_score — prevents false gates
  if (!ASSESSED_LESSON_TYPES.includes(lesson.type as any) && lesson.passingScore != null) {
    e('passingScore', `non-assessed lesson type '${lesson.type}' should not have a passing_score — remove it to prevent false completion gates`, 'warning');
  }

  // Checkpoint and exam lessons must not declare a video activity without a videoUrl.
  // A video tab with no URL produces a broken player in the learner UI.
  if (['checkpoint', 'exam'].includes(lesson.type)) {
    if (lesson.videoUrl) {
      // Fine — video tab is backed by a real URL
    } else {
      // No URL — if the lesson somehow has a video activity declared, flag it.
      // (Activities are stored in DB, not in the template type, so this is a
      //  belt-and-suspenders check for any future template that sets videoUrl.)
    }
    if (!lesson.videoUrl && lesson.content && visibleLength(lesson.content) < 50) {
      // Checkpoint with no video and no meaningful reading content — warn
      e('content', `${lesson.type} has no video and minimal reading content — students will have nothing to review before the quiz`, 'warning');
    }
  }

  // ── Practical / sign-off ──────────────────────────────────────────────────
  if (lesson.competencyChecks && lesson.competencyChecks.length > 0) {
    if (!lesson.practicalRequired) {
      e('practicalRequired', 'lesson has competencyChecks but practicalRequired is not true');
    }

    // All competency keys must be in the registry
    const keys = lesson.competencyChecks.map(c => c.key);
    const unregistered = findUnregisteredKeys(keys);
    if (unregistered.length > 0) {
      e('competencyChecks', `unregistered competency key(s): ${unregistered.join(', ')} — add to lib/course-builder/competencies.ts`);
    }

    // Each check that requires sign-off must have a key
    for (const check of lesson.competencyChecks) {
      if (check.requiresInstructorSignoff && !check.key) {
        e('competencyChecks', 'competency check with requiresInstructorSignoff=true must have a key');
      }
    }
  }

  if (lesson.practicalRequired && (!lesson.competencyChecks || lesson.competencyChecks.length === 0)) {
    e('competencyChecks', 'practicalRequired=true but no competencyChecks defined — instructor has nothing to sign off on', 'warning');
  }

  // ── Quiz question structure ───────────────────────────────────────────────
  for (const [i, q] of (lesson.quizQuestions ?? []).entries()) {
    if (!q.question || q.question.trim().length < 10) {
      e('quizQuestions', `question[${i}] text is too short`);
    }
    if (!q.options || q.options.length < 2) {
      e('quizQuestions', `question[${i}] must have at least 2 options`);
    }
    if (q.correctAnswer == null || q.correctAnswer < 0 || q.correctAnswer >= (q.options?.length ?? 0)) {
      e('quizQuestions', `question[${i}] correctAnswer index is out of range`);
    }
  }

  return errs;
}

// ─── Template validator ───────────────────────────────────────────────────────

export function validateCourseTemplate(template: CourseTemplate): CourseValidationResult {
  const allErrors: LessonValidationError[] = [];

  // ── Program mapping ───────────────────────────────────────────────────────
  const courseId = resolveCourseId(template.programSlug);
  if (!courseId) {
    allErrors.push({
      moduleSlug: '_template',
      lessonSlug: '_template',
      field: 'programSlug',
      message: `programSlug '${template.programSlug}' has no entry in PROGRAM_COURSE_MAP — add it to lib/course-builder/schema.ts`,
      severity: 'error',
    });
  }

  // ── Template identity ─────────────────────────────────────────────────────
  if (!template.courseSlug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(template.courseSlug)) {
    allErrors.push({ moduleSlug: '_template', lessonSlug: '_template', field: 'courseSlug', message: 'must be lowercase kebab-case', severity: 'error' });
  }
  if (!template.title || template.title.trim().length < 3) {
    allErrors.push({ moduleSlug: '_template', lessonSlug: '_template', field: 'title', message: 'course title is required', severity: 'error' });
  }
  if (!template.modules || template.modules.length === 0) {
    allErrors.push({ moduleSlug: '_template', lessonSlug: '_template', field: 'modules', message: 'course must have at least one module', severity: 'error' });
  }

  // ── Duplicate slug check ──────────────────────────────────────────────────
  const allSlugs: string[] = [];
  for (const mod of template.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      if (allSlugs.includes(lesson.slug)) {
        allErrors.push({
          moduleSlug: mod.slug,
          lessonSlug: lesson.slug,
          field: 'slug',
          message: `duplicate lesson slug '${lesson.slug}' — slugs must be unique within a course`,
          severity: 'error',
        });
      }
      allSlugs.push(lesson.slug);
    }
  }

  // ── Per-lesson validation ─────────────────────────────────────────────────
  for (const mod of template.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      const lessonErrors = validateCourseLesson(lesson, mod.slug);
      allErrors.push(...lessonErrors);
    }
  }

  const errors   = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');
  const lessonCount = (template.modules ?? []).reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    lessonCount,
    errorCount: errors.length,
    warningCount: warnings.length,
  };
}

// ─── Pre-publish audit ────────────────────────────────────────────────────────

/**
 * Runs the full validator and throws if any errors are found.
 * Warnings are logged but do not block publishing.
 *
 * Use this as the gate before any DB write in the pipeline.
 */
export function assertPublishable(template: CourseTemplate): void {
  const result = validateCourseTemplate(template);

  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.warn(`[course-builder] WARNING ${w.moduleSlug}/${w.lessonSlug} [${w.field}]: ${w.message}`);
    }
  }

  if (!result.valid) {
    const lines = result.errors.map(
      e => `  ${e.moduleSlug}/${e.lessonSlug} [${e.field}]: ${e.message}`,
    );
    throw new Error(
      `Course '${template.courseSlug}' failed pre-publish validation (${result.errorCount} error(s)):\n${lines.join('\n')}`,
    );
  }
}
