/**
 * lib/lms/engine — canonical program delivery service layer
 *
 * All LMS read/write operations for learner progress, access gating,
 * and certificate issuance route through this module. Do not call
 * Supabase directly from lesson pages or API routes for these concerns —
 * use these functions instead.
 *
 * Read path:
 *   getProgramStructure   — ordered module/lesson tree from curriculum_lessons
 *   getLearnerProgress    — all progress state for a user+course in one pass
 *   canAccessLesson       — access decision with LearnerState (pure, no DB)
 *
 * Write path:
 *   recordStepCompletion      — mark lesson complete, recalc progress %
 *   recordCheckpointAttempt   — write checkpoint_scores row
 *   issueCertificateIfEligible — write program_completion_certificates if eligible
 *
 * Types:
 *   LearnerState, StepType, EngineLesson, EngineModule, ProgramStructure,
 *   LearnerProgress, AccessDecision, StepCompletionResult,
 *   CheckpointAttemptResult, GATED_STEP_TYPES, REVIEW_STEP_TYPES
 */

export { getProgramStructure } from './structure';
export { getLearnerProgress } from './progress';
export { canAccessLesson } from './access';
export { recordStepCompletion, recordStepUncompletion, recordCheckpointAttempt } from './completion';
export { issueCertificateIfEligible } from './certificate';
export {
  getOrgPrograms,
  getOrgCohorts,
  getOrgLearners,
  getOrgProgress,
} from './org-scope';
export type {
  OrgProgram,
  OrgCohort,
  OrgLearner,
  OrgProgressSummary,
  OrgReportFilters,
} from './org-scope';

export type {
  LearnerState,
  StepType,
  EngineLesson,
  EngineModule,
  ProgramStructure,
  LearnerProgress,
  LessonProgress,
  CheckpointScore,
  StepSubmission,
  AccessDecision,
  StepCompletionResult,
  CheckpointAttemptResult,
} from './types';

export { GATED_STEP_TYPES, REVIEW_STEP_TYPES } from './types';
