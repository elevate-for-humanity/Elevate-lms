/**
 * lib/lms/engine — canonical program delivery service layer
 *
 * LMS engine scope is learner structure, access gating, lesson progress, and
 * checkpoint attempts. Certificate issuance is owned exclusively by
 * lib/certificates/issue-certificate.ts after canonical completion evaluation.
 */

export { getProgramStructure } from './structure';
export { getLearnerProgress } from './progress';
export { canAccessLesson } from './access';
export {
  recordStepCompletion,
  recordStepUncompletion,
  recordCheckpointAttempt,
} from './completion';
export { enforceCheckpointGate } from './gate';
export type { CheckpointGateError } from './gate';
export { getOrgPrograms, getOrgCohorts, getOrgLearners, getOrgProgress } from './org-scope';
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
