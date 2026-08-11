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

  if (needsQuiz) {
    const quizCount = lesson.quizQuestions?.length ?? 0;
    const minQuestions = stepType === 'exam' ? 10 : 5;
    if (quizCount < minQuestions) {
      errors.push({
        type: 'error',
        module: moduleSlug,
        lesson: lesson.slug,
        field: 'quizQuestions',
        message: `${stepType} requires at least ${minQuestions} questions, found ${quizCount}`,
      });
    }
  }

  if (needsQuiz && (lesson.passingScore === undefined || lesson.passingScore < 0 || lesson.passingScore > 100)) {
    warnings.push({
      type: 'warning',
      module: moduleSlug,
      lesson: lesson.slug,
      field: 'passingScore',
      message: 'Valid passing score (0-100) should be set',
    });
  }

  return errors.length > 0 ? errors : warnings;
}

// ─── Module Validation ─────────────────────────────────────────────────────────

function validateModule(module: BlueprintModule): ValidationError[] {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!module.slug?.trim()) {
    errors.push({
      type: 'error',
      module: module.slug || 'unknown',
      field: 'slug',
      message: 'Module slug is required',
    });
  }

  if (!module.title?.trim()) {
    errors.push({
      type: 'error',
      module: module.slug || 'unknown',
      field: 'title',
      message: 'Module title is required',
    });
  }

  if (!module.lessons || module.lessons.length === 0) {
    warnings.push({
      type: 'warning',
      module: module.slug || 'unknown',
      field: 'lessons',
      message: 'Module has no lessons',
    });
  }

  for (const lesson of module.lessons ?? []) {
    const lessonErrors = validateLesson(lesson, module.slug);
    for (const err of lessonErrors) {
      if (err.type === 'error') errors.push(err);
      else warnings.push(err);
    }
  }

  return errors.length > 0 ? errors : warnings;
}

// ─── Main Validator ─────────────────────────────────────────────────────────────

export function validateBlueprint(blueprint: CredentialBlueprint): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  if (!blueprint.programSlug?.trim()) {
    allErrors.push({
      type: 'error',
      field: 'programSlug',
      message: 'Program slug is required',
    });
  }

  if (!blueprint.credentialTitle?.trim()) {
    allErrors.push({
      type: 'error',
      field: 'credentialTitle',
      message: 'Credential title is required',
    });
  }

  if (!blueprint.modules || blueprint.modules.length === 0) {
    allErrors.push({
      type: 'error',
      field: 'modules',
      message: 'Blueprint must have at least one module',
    });
  }

  let lessonCount = 0;
  for (const mod of blueprint.modules ?? []) {
    const moduleErrors = validateModule(mod);
    for (const err of moduleErrors) {
      if (err.type === 'error') allErrors.push(err);
      else allWarnings.push(err);
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
  const modules = template.modules ?? [];
  return validateBlueprint({
    id: 'legacy-template-validation',
    programSlug: 'unknown',
    credentialSlug: 'unknown',
    credentialTitle: 'Unknown',
    credentialCode: 'UNKNOWN',
    state: 'NA',
    status: 'draft',
    version: 'legacy',
    modules,
    expectedModuleCount: modules.length,
    expectedLessonCount: 0,
    assessmentRules: [],
    generationRules: {},
    contentSource: 'blueprint',
  });
}
