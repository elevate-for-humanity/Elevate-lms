/**
 * validator.ts
 * 
 * Course validation for the Course Factory.
 * Replaces: lib/course-builder/audit.ts
 * 
 * Validates blueprint structure and content before publishing.
 */

import type { CredentialBlueprint, BlueprintModule } from '@/lib/curriculum/blueprints/types';
import { logger } from '@/lib/logger';

// ─── Validation Result ─────────────────────────────────────────────────────────

export interface ValidationError {
  type: 'error' | 'warning';
  module?: string;
  lesson?: string;
  field: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  errorCount: number;
  warningCount: number;
}

// ─── Step Type Inference ────────────────────────────────────────────────────────

export function inferStepType(slug: string): string {
  const lower = slug.toLowerCase();
  if (lower.includes('checkpoint')) return 'checkpoint';
  if (lower.includes('exam') || lower.includes('final')) return 'exam';
  if (lower.includes('quiz')) return 'quiz';
  if (lower.includes('lab')) return 'lab';
  if (lower.includes('assignment')) return 'assignment';
  return 'lesson';
}

// ─── Content Validation ─────────────────────────────────────────────────────────

function visibleTextLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').trim().length;
}

function validateLesson(
  lesson: { slug: string; title: string; objective?: string; content?: string; quizQuestions?: unknown[]; passingScore?: number },
  moduleSlug: string,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const stepType = inferStepType(lesson.slug);

  const needsContent = ['lesson', 'checkpoint', 'lab', 'assignment'].includes(stepType);
  const needsQuiz = ['checkpoint', 'quiz', 'exam'].includes(stepType);
  const needsObjective = ['lesson', 'checkpoint', 'lab', 'assignment'].includes(stepType);

  if (needsObjective && !lesson.objective?.trim()) {
    errors.push({
      type: 'error',
      module: moduleSlug,
      lesson: lesson.slug,
      field: 'objective',
      message: 'Lesson objective is required',
    });
  }

  if (needsContent) {
    if (!lesson.content?.trim()) {
      errors.push({
        type: 'error',
        module: moduleSlug,
        lesson: lesson.slug,
        field: 'content',
        message: 'Lesson content is required',
      });
    } else if (visibleTextLength(lesson.content) < 200) {
      warnings.push({
        type: 'warning',
        module: moduleSlug,
        lesson: lesson.slug,
        field: 'content',
        message: `Content may be too short (${visibleTextLength(lesson.content)} chars, minimum 200)`,
      });
    }
  }

  if (needsQuiz && (!lesson.quizQuestions || lesson.quizQuestions.length === 0)) {
    errors.push({
      type: 'error',
      module: moduleSlug,
      lesson: lesson.slug,
      field: 'quizQuestions',
      message: 'Quiz questions are required',
    });
  }

  if (needsQuiz && lesson.passingScore != null && (lesson.passingScore < 0 || lesson.passingScore > 100)) {
    errors.push({
      type: 'error',
      module: moduleSlug,
      lesson: lesson.slug,
      field: 'passingScore',
      message: 'Passing score must be between 0 and 100',
    });
  }

  return [...errors, ...warnings];
}

// ─── Blueprint Validation ───────────────────────────────────────────────────────

export function validateBlueprint(blueprint: CredentialBlueprint): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  if (!blueprint.programSlug?.trim()) {
    allErrors.push({ type: 'error', field: 'programSlug', message: 'Program slug is required' });
  }
  if (!blueprint.credentialTitle?.trim()) {
    allErrors.push({ type: 'error', field: 'credentialTitle', message: 'Credential title is required' });
  }
  if (!Array.isArray(blueprint.modules) || blueprint.modules.length === 0) {
    allErrors.push({ type: 'error', field: 'modules', message: 'At least one module is required' });
  }

  if (blueprint.expectedModuleCount && blueprint.modules.length < blueprint.expectedModuleCount) {
    allWarnings.push({
      type: 'warning',
      field: 'expectedModuleCount',
      message: `Expected ${blueprint.expectedModuleCount} modules, found ${blueprint.modules.length}`,
    });
  }

  let lessonCount = 0;
  for (const mod of blueprint.modules) {
    if (!mod.slug?.trim()) {
      allErrors.push({ type: 'error', module: mod.title, field: 'slug', message: 'Module slug is required' });
    }
    if (!mod.title?.trim()) {
      allErrors.push({ type: 'error', module: mod.slug, field: 'title', message: 'Module title is required' });
    }

    const lessons = mod.lessons ?? [];
    if (mod.minLessons && lessons.length < mod.minLessons) {
      allWarnings.push({
        type: 'warning',
        module: mod.slug,
        field: 'lessons',
        message: `Module has ${lessons.length} lessons; minimum is ${mod.minLessons}`,
      });
    }
    if (mod.maxLessons && lessons.length > mod.maxLessons) {
      allWarnings.push({
        type: 'warning',
        module: mod.slug,
        field: 'lessons',
        message: `Module has ${lessons.length} lessons; maximum is ${mod.maxLessons}`,
      });
    }

    for (const lesson of lessons) {
      for (const issue of validateLesson(lesson, mod.slug)) {
        if (issue.type === 'error') allErrors.push(issue);
        else allWarnings.push(issue);
      }
    }

    lessonCount += mod.lessons?.length ?? 0;
  }

  if (blueprint.expectedLessonCount && lessonCount < blueprint.expectedLessonCount) {
    allWarnings.push({
      type: 'warning',
      field: 'expectedLessonCount',
      message: `Expected ${blueprint.expectedLessonCount} lessons, found ${lessonCount}`,
    });
  }

  const result: ValidationResult = {
    ok: allErrors.length === 0,
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    errorCount: allErrors.length,
    warningCount: allWarnings.length,
  };

  if (!result.ok) {
    logger.warn('[validator] Blueprint validation failed', {
      errors: allErrors.length,
      warnings: allWarnings.length,
    });
  }

  return result;
}

// ─── Simple API ────────────────────────────────────────────────────────────────

export function validateCourseTemplate(template: { modules?: BlueprintModule[] }): ValidationResult {
  const blueprint: CredentialBlueprint = {
    id: 'course-template-validation',
    programSlug: 'unknown',
    credentialSlug: 'unknown',
    credentialTitle: 'Unknown',
    credentialCode: 'UNKNOWN',
    state: 'NA',
    status: 'draft',
    version: '1',
    modules: template.modules ?? [],
    expectedModuleCount: 0,
    expectedLessonCount: 0,
    assessmentRules: [],
    generationRules: {},
    contentSource: 'blueprint',
  };

  return validateBlueprint(blueprint);
}
