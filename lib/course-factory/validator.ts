import { logger } from '@/lib/logger';
import type { CredentialBlueprint, BlueprintModule } from '@/lib/curriculum/blueprints/types';

export interface ValidationIssue {
  code: string;
  message: string;
  path?: string;
  severity?: 'error' | 'warning';
}

export interface ValidationResult {
  ok: boolean;
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}

function issue(code: string, message: string, path?: string, severity: 'error' | 'warning' = 'error'): ValidationIssue {
  return { code, message, path, severity };
}

function validateModule(module: BlueprintModule, index: number): { errors: ValidationIssue[]; warnings: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const path = `modules[${index}]`;

  if (!module.slug?.trim()) errors.push(issue('MODULE_SLUG_REQUIRED', 'Module slug is required.', `${path}.slug`));
  if (!module.title?.trim()) errors.push(issue('MODULE_TITLE_REQUIRED', 'Module title is required.', `${path}.title`));
  if (!Number.isFinite(module.orderIndex)) errors.push(issue('MODULE_ORDER_REQUIRED', 'Module orderIndex must be numeric.', `${path}.orderIndex`));

  const minLessons = Number(module.minLessons ?? 0);
  const maxLessons = Number(module.maxLessons ?? 0);
  if (minLessons < 0 || maxLessons < 0 || (maxLessons > 0 && minLessons > maxLessons)) {
    errors.push(issue('MODULE_LESSON_RANGE_INVALID', 'Module lesson-count bounds are invalid.', path));
  }

  const lessons = Array.isArray(module.lessons) ? module.lessons : [];
  if (minLessons > 0 && lessons.length && lessons.length < minLessons) {
    warnings.push(issue('MODULE_BELOW_MIN_LESSONS', `Module contains ${lessons.length} lesson(s); blueprint minimum is ${minLessons}.`, `${path}.lessons`, 'warning'));
  }
  if (maxLessons > 0 && lessons.length > maxLessons) {
    errors.push(issue('MODULE_ABOVE_MAX_LESSONS', `Module contains ${lessons.length} lesson(s); blueprint maximum is ${maxLessons}.`, `${path}.lessons`));
  }

  const seenLessonSlugs = new Set<string>();
  lessons.forEach((lesson, lessonIndex) => {
    const lessonPath = `${path}.lessons[${lessonIndex}]`;
    if (!lesson.slug?.trim()) errors.push(issue('LESSON_SLUG_REQUIRED', 'Lesson slug is required.', `${lessonPath}.slug`));
    if (lesson.slug && seenLessonSlugs.has(lesson.slug)) errors.push(issue('LESSON_SLUG_DUPLICATE', `Duplicate lesson slug: ${lesson.slug}`, `${lessonPath}.slug`));
    if (lesson.slug) seenLessonSlugs.add(lesson.slug);
    if (!lesson.title?.trim()) errors.push(issue('LESSON_TITLE_REQUIRED', 'Lesson title is required.', `${lessonPath}.title`));
    if (!Number.isFinite(lesson.order)) errors.push(issue('LESSON_ORDER_REQUIRED', 'Lesson order must be numeric.', `${lessonPath}.order`));
  });

  return { errors, warnings };
}

export function validateBlueprint(blueprint: CredentialBlueprint): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!blueprint.programSlug?.trim()) errors.push(issue('PROGRAM_SLUG_REQUIRED', 'programSlug is required.', 'programSlug'));
  if (!blueprint.credentialTitle?.trim()) errors.push(issue('CREDENTIAL_TITLE_REQUIRED', 'credentialTitle is required.', 'credentialTitle'));
  if (!Array.isArray(blueprint.modules) || blueprint.modules.length === 0) {
    errors.push(issue('MODULES_REQUIRED', 'At least one module is required.', 'modules'));
  }

  const seenModuleSlugs = new Set<string>();
  (blueprint.modules ?? []).forEach((module, index) => {
    if (module.slug && seenModuleSlugs.has(module.slug)) {
      errors.push(issue('MODULE_SLUG_DUPLICATE', `Duplicate module slug: ${module.slug}`, `modules[${index}].slug`));
    }
    if (module.slug) seenModuleSlugs.add(module.slug);
    const validated = validateModule(module, index);
    errors.push(...validated.errors);
    warnings.push(...validated.warnings);
  });

  const expectedModules = Number(blueprint.expectedModuleCount ?? 0);
  if (expectedModules > 0 && blueprint.modules?.length !== expectedModules) {
    warnings.push(issue(
      'MODULE_COUNT_MISMATCH',
      `Expected ${expectedModules} module(s); found ${blueprint.modules?.length ?? 0}.`,
      'expectedModuleCount',
      'warning',
    ));
  }

  const lessonCount = (blueprint.modules ?? []).reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0);
  const expectedLessons = Number(blueprint.expectedLessonCount ?? 0);
  if (expectedLessons > 0 && lessonCount > 0 && lessonCount !== expectedLessons) {
    warnings.push(issue(
      'LESSON_COUNT_MISMATCH',
      `Expected ${expectedLessons} lesson(s); found ${lessonCount}.`,
      'expectedLessonCount',
      'warning',
    ));
  }

  const result: ValidationResult = {
    ok: errors.length === 0,
    valid: errors.length === 0,
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length,
  };

  if (!result.ok) {
    logger.warn('[validator] Blueprint validation failed', {
      errors: errors.length,
      warnings: warnings.length,
    });
  }

  return result;
}

// Simple wrapper for legacy callers that only provide module arrays. This is a
// structural validation path, so synthesize the minimum canonical blueprint
// fields rather than asserting an incomplete object directly.
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
    expectedLessonCount: modules.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0),
    assessmentRules: [],
    generationRules: {},
    contentSource: 'blueprint',
  });
}
