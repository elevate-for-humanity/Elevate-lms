/**
 * Course validation for the canonical Course Factory.
 *
 * Registered blueprints are validated structurally before enrichment. Generated
 * lesson experience, content and assessment requirements are enforced once the
 * package contains generated content. This prevents preflight from rejecting a
 * valid blueprint merely because generation has not happened yet.
 */
import type { CredentialBlueprint, BlueprintModule } from '@/lib/curriculum/blueprints/types';
import { validateBlueprint as validateBlueprintStructure } from '@/lib/curriculum/blueprints/validateBlueprint';
import { logger } from '@/lib/logger';
import { CourseExperienceSchema } from './experience-contract';

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
  if (
    lower.includes('practice-assessment') ||
    lower.includes('practice-exam') ||
    lower.includes('benchmark-assessment') ||
    lower.includes('readiness-assessment')
  ) return 'exam';
  if (lower.includes('exam') || lower.includes('final')) return 'exam';
  if (lower.includes('quiz')) return 'quiz';
  if (lower.includes('lab') || lower.includes('practical')) return 'lab';
  if (lower.includes('assignment')) return 'assignment';
  if (lower.includes('certification')) return 'certification';
  return 'lesson';
}

function visibleTextLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').trim().length;
}

function readExperience(content: string): Record<string, any> | null {
  try {
    const parsed = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      parsed.experience &&
      typeof parsed.experience === 'object' &&
      !Array.isArray(parsed.experience)
    ) return parsed.experience as Record<string, any>;
  } catch {
    return null;
  }
  return null;
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
  const lowerSlug = lesson.slug.toLowerCase();
  const needsContent = ['lesson', 'checkpoint', 'lab', 'assignment'].includes(stepType);
  const needsQuiz = ['checkpoint', 'quiz', 'exam'].includes(stepType);
  const needsObjective = ['lesson', 'checkpoint', 'lab', 'assignment'].includes(stepType);

  if (needsObjective && !lesson.objective?.trim()) {
    errors.push({ type: 'error', module: moduleSlug, lesson: lesson.slug, field: 'objective', message: 'Lesson objective is required' });
  }

  if (needsContent) {
    if (!lesson.content?.trim()) {
      errors.push({ type: 'error', module: moduleSlug, lesson: lesson.slug, field: 'content', message: 'Lesson content is required' });
    } else if (visibleTextLength(lesson.content) < 200) {
      warnings.push({ type: 'warning', module: moduleSlug, lesson: lesson.slug, field: 'content', message: `Content may be too short (${visibleTextLength(lesson.content)} chars, minimum 200)` });
    }
  }

  if (needsContent && lesson.content?.trim()) {
    const experience = readExperience(lesson.content);
    if (!experience) {
      errors.push({ type: 'error', module: moduleSlug, lesson: lesson.slug, field: 'experience', message: 'Complete commercial self-paced lesson experience is required' });
    } else {
      const parsedExperience = CourseExperienceSchema.safeParse(experience);
      if (!parsedExperience.success) {
        for (const issue of parsedExperience.error.issues) {
          errors.push({
            type: 'error',
            module: moduleSlug,
            lesson: lesson.slug,
            field: `experience.${issue.path.join('.')}`,
            message: issue.message,
          });
        }
      }
    }
  }

  const questionCount = lesson.quizQuestions?.length ?? 0;
  if (needsQuiz && questionCount === 0) {
    errors.push({ type: 'error', module: moduleSlug, lesson: lesson.slug, field: 'quizQuestions', message: 'Assessment questions are required' });
  }
  if (stepType === 'checkpoint' && questionCount > 0 && questionCount < 10) {
    errors.push({ type: 'error', module: moduleSlug, lesson: lesson.slug, field: 'quizQuestions', message: 'Domain checkpoint requires at least 10 questions' });
  }
  if (stepType === 'exam' && lowerSlug.includes('practice') && questionCount > 0 && questionCount < 25) {
    errors.push({ type: 'error', module: moduleSlug, lesson: lesson.slug, field: 'quizQuestions', message: 'Practice/readiness exam requires at least 25 questions' });
  }
  if (stepType === 'exam' && (lowerSlug.includes('final') || lowerSlug.includes('course-exam')) && questionCount > 0 && questionCount < 25) {
    errors.push({ type: 'error', module: moduleSlug, lesson: lesson.slug, field: 'quizQuestions', message: 'Final exam requires at least 25 questions' });
  }
  if (needsQuiz && lesson.passingScore != null && (lesson.passingScore < 0 || lesson.passingScore > 100)) {
    errors.push({ type: 'error', module: moduleSlug, lesson: lesson.slug, field: 'passingScore', message: 'Passing score must be between 0 and 100' });
  }
  return [...errors, ...warnings];
}

export function validateBlueprint(blueprint: CredentialBlueprint): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  try {
    validateBlueprintStructure(blueprint);
  } catch (error) {
    allErrors.push({ type: 'error', field: 'blueprint', message: error instanceof Error ? error.message : String(error) });
  }

  const lessons = (blueprint.modules ?? []).flatMap((courseModule) => courseModule.lessons ?? []);
  const generatedPackage = lessons.some((lesson) =>
    Boolean(lesson.content?.trim()) ||
    Boolean(lesson.objective?.trim()) ||
    Boolean(lesson.quizQuestions?.length),
  );

  if (generatedPackage) {
    for (const courseModule of blueprint.modules ?? []) {
      for (const lesson of courseModule.lessons ?? []) {
        for (const issue of validateLesson(lesson, courseModule.slug)) {
          if (issue.type === 'error') allErrors.push(issue);
          else allWarnings.push(issue);
        }
      }
    }
  }

  if (blueprint.generationRules?.requiresFinalExam) {
    const hasFinal = lessons.some((lesson) => {
      const slug = lesson.slug.toLowerCase();
      return inferStepType(slug) === 'exam' && (slug.includes('final') || slug.includes('course-exam'));
    });
    if (!hasFinal) allErrors.push({ type: 'error', field: 'finalExam', message: 'Course requires a cumulative final exam' });
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
      phase: generatedPackage ? 'generated-package' : 'blueprint-structure',
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
    expectedLessonCount: modules.reduce((count, courseModule) => count + (courseModule.lessons?.length ?? 0), 0),
    assessmentRules: [{ assessmentType: 'module', scope: 'all', minQuestions: 1, maxQuestions: 1, passingThreshold: 0.7 }],
    generationRules: {},
    contentSource: 'blueprint',
  };
  return validateBlueprint(blueprint);
}
