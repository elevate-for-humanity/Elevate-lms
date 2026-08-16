/**
 * Course validation for the canonical Course Factory.
 *
 * Structural blueprint rules remain owned by the curriculum blueprint validator.
 * This adapter adds generated-content validation so Course Factory has one
 * validation stage without duplicating the authoritative blueprint contract.
 */

import type { CredentialBlueprint, BlueprintModule } from '@/lib/curriculum/blueprints/types';
import { validateBlueprint as validateBlueprintStructure } from '@/lib/curriculum/blueprints/validateBlueprint';
import { logger } from '@/lib/logger';

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

export function inferStepType(slug: string): string {
  const lower = slug.toLowerCase();
  if (lower.includes('checkpoint')) return 'checkpoint';
  if (lower.includes('exam') || lower.includes('final')) return 'exam';
  if (lower.includes('quiz')) return 'quiz';
  if (lower.includes('lab') || lower.includes('practical')) return 'lab';
  if (lower.includes('assignment')) return 'assignment';
  if (lower.includes('orientation')) return 'orientation';
  if (lower.includes('scenario')) return 'scenario';
  if (lower.includes('concept')) return 'concept';
  return 'lesson';
}

function visibleTextLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').trim().length;
}

function validateLesson(
  lesson: {
    slug: string;
    title: string;
    objective?: string;
    content?: string;
    quizQuestions?: unknown[];
    passingScore?: number;
  },
  moduleSlug: string,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const stepType = inferStepType(lesson.slug);

  const needsContent = [
    'lesson',
    'orientation',
    'concept',
    'scenario',
    'checkpoint',
    'lab',
    'assignment',
  ].includes(stepType);
  const needsQuiz = ['checkpoint', 'quiz', 'exam'].includes(stepType);
  const needsObjective = [
    'lesson',
    'orientation',
    'concept',
    'scenario',
    'checkpoint',
    'lab',
    'assignment',
  ].includes(stepType);

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

  if (
    needsQuiz &&
    lesson.passingScore != null &&
    (lesson.passingScore < 0 || lesson.passingScore > 100)
  ) {
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

export function validateBlueprint(blueprint: CredentialBlueprint): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  try {
    validateBlueprintStructure(blueprint);
  } catch (error) {
    allErrors.push({
      type: 'error',
      field: 'blueprint',
      message: error instanceof Error ? error.message : String(error),
    });
  }

  for (const courseModule of blueprint.modules ?? []) {
    for (const lesson of courseModule.lessons ?? []) {
      for (const issue of validateLesson(lesson, courseModule.slug)) {
        if (issue.type === 'error') allErrors.push(issue);
        else allWarnings.push(issue);
      }
    }
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
    logger.warn('[course-factory/validator] Course package validation failed', {
      errors: allErrors.length,
      warnings: allWarnings.length,
    });
  }

  return result;
}

export function validateCourseTemplate(template: { modules?: BlueprintModule[] }): ValidationResult {
  const modules = template.modules ?? [];
  const blueprint: CredentialBlueprint = {
    id: 'course-template-validation',
    programSlug: 'unknown',
    credentialSlug: 'unknown',
    credentialTitle: 'Unknown',
    credentialCode: 'UNKNOWN',
    state: 'NA',
    status: 'draft',
    version: '1',
    modules,
    expectedModuleCount: modules.length,
    expectedLessonCount: modules.reduce(
      (count, courseModule) => count + (courseModule.lessons?.length ?? 0),
      0,
    ),
    assessmentRules: [
      {
        assessmentType: 'module',
        scope: 'all',
        minQuestions: 1,
        maxQuestions: 1,
        passingThreshold: 0.7,
      },
    ],
    generationRules: {},
    contentSource: 'blueprint',
  };

  return validateBlueprint(blueprint);
}
