/**
 * Course Factory
 *
 * Private execution capabilities with a public Course Builder compatibility facade.
 * Application callers that import courseFactory from this barrel cross the
 * canonical Course Builder orchestration layer before factory.ts executes.
 */

// ─── Main API ─────────────────────────────────────────────────────────────────

export { courseFactory } from '../course-builder/orchestrator';
export type { FactoryInput, FactoryOutput, FactoryStage, ProgressCallback } from './types';

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
