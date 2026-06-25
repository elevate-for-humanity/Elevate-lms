/**
 * Course Factory
 * 
 * Unified course generation system.
 * 
 * Usage:
 * 
 * ```typescript
 * import { courseFactory, createCourse, validateBlueprint } from '@/lib/course-factory';
 * 
 * // Simple API
 * const result = await createCourse({ programSlug: 'hvac' });
 * 
 * // Full API with progress
 * const result = await courseFactory({
 *   programSlug: 'hvac',
 *   mode: 'replace',
 *   contentSource: 'ai',
 * }, (stage, message) => {
 *   console.log(`${stage}: ${message}`);
 * });
 * 
 * // Validate a blueprint
 * const validation = validateBlueprint(blueprint);
 * if (!validation.valid) {
 *   console.error('Validation failed:', validation.errors);
 * }
 * ```
 */

// ─── Main API ─────────────────────────────────────────────────────────────────

export { courseFactory, createCourse, factoryFromSlug } from './factory';
export type { FactoryInput, FactoryOutput, FactoryStage, ProgressCallback } from './factory';

// ─── Blueprint API ─────────────────────────────────────────────────────────────

export {
  loadBlueprintWithProgram,
  loadAllBlueprints,
  getBlueprintBySlug,
  getBlueprintByCredentialCode,
  resolveProgram,
  buildBlueprintIndex,
  listBlueprints,
} from './blueprint-loader';

export type { BlueprintWithProgram } from './blueprint-loader';

// ─── Content Generation API ────────────────────────────────────────────────────

export {
  generateLessonContent,
  generateAssessment,
  generateFinalExam,
  generateBlueprintFromAI,
  generateCompetencyMapping,
} from './content-generator';

export type {
  GeneratedLessonContent,
  AssessmentGenerationInput,
  BlueprintGenerationInput,
  CompetencyMapping,
} from './content-generator';

// ─── Publisher API ──────────────────────────────────────────────────────────────

export { publishCourse, publishCourseAtomic } from './publisher';

export type { PublishInput, PublishResult } from './publisher';

// ─── Validator API ─────────────────────────────────────────────────────────────

export { validateBlueprint, validateCourseTemplate, inferStepType } from './validator';

export type { ValidationResult, ValidationError } from './validator';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type {
  BuildMode,
  VideoMode,
  ContentSource,
  PublishStatus,
  LessonType,
  CredentialLevel,
  BlueprintLessonRef,
  BlueprintModule,
  BlueprintVideoConfig,
  CredentialBlueprint,
  CourseOutline,
  CourseModuleOutline,
  CourseLessonOutline,
  Course,
  CourseModule,
  CourseLesson,
  QuizQuestion,
  AssessmentConfig,
  FactoryStatus,
} from './types';
