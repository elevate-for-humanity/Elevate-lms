/**
 * Shared types for the program delivery engine.
 *
 * All engine functions operate on these types. Callers should import from
 * '@/lib/lms/engine' rather than from individual files.
 */

// ─── Learner state ────────────────────────────────────────────────────────────

/**
 * The state a learner can be in for a given lesson or program.
 *
 * - not_started     : no progress row exists
 * - in_progress     : started but not complete
 * - blocked         : sequential lock — prior lesson not complete
 * - awaiting_review : step_submission exists with status submitted/under_review
 * - passed          : checkpoint/quiz/exam with score >= passing_score
 * - failed          : checkpoint/quiz/exam with score < passing_score
 * - completed       : lesson marked complete (non-gated types)
 * - certified       : program complete + certificate issued
 */
export type LearnerState =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'awaiting_review'
  | 'passed'
  | 'failed'
  | 'completed'
  | 'certified';

// ─── Step types ───────────────────────────────────────────────────────────────

export type StepType =
  | 'lesson'
  | 'quiz'
  | 'checkpoint'
  | 'lab'
  | 'assignment'
  | 'exam'
  | 'certification';

/** Step types that require a passing score before the learner can advance. */
export const GATED_STEP_TYPES: StepType[] = ['quiz', 'checkpoint', 'exam'];

/** Step types that require instructor sign-off (step_submissions). */
export const REVIEW_STEP_TYPES: StepType[] = ['lab', 'assignment'];

// ─── Program structure ────────────────────────────────────────────────────────

export interface EngineLesson {
  id: string;
  lessonSlug: string;
  lessonTitle: string;
  stepType: StepType;
  passingScore: number;
  moduleOrder: number;
  lessonOrder: number;
  durationMinutes: number | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  moduleTitle: string | null;
  videoFile: string | null;
  scriptText: string | null;
}

export interface EngineModule {
  moduleOrder: number;
  moduleTitle: string;
  lessons: EngineLesson[];
}

export interface ProgramStructure {
  courseId: string;
  courseName: string;
  modules: EngineModule[];
  totalLessons: number;
  publishedLessons: number;
}

// ─── Learner progress ─────────────────────────────────────────────────────────

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  timeSpentSeconds: number;
}

export interface CheckpointScore {
  lessonId: string;
  score: number;
  passed: boolean;
  passingScore: number;
  attemptNumber: number;
  createdAt: string;
}

export interface StepSubmission {
  id: string;
  lessonId: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';
  createdAt: string;
}

export interface LearnerProgress {
  userId: string;
  courseId: string;
  completedLessonIds: Set<string>;
  checkpointScores: Map<string, CheckpointScore>;
  stepSubmissions: Map<string, StepSubmission>;
  progressPercent: number;
  courseCompleted: boolean;
  certificateNumber: string | null;
}

// ─── Access decision ──────────────────────────────────────────────────────────

export interface AccessDecision {
  canAccess: boolean;
  state: LearnerState;
  /** Human-readable reason when canAccess is false. */
  reason: string | null;
}

// ─── Completion result ────────────────────────────────────────────────────────

export interface StepCompletionResult {
  lessonId: string;
  courseId: string;
  progressPercent: number;
  courseCompleted: boolean;
  certificateIssued: boolean;
  certificateNumber: string | null;
}

export interface CheckpointAttemptResult {
  lessonId: string;
  score: number;
  passed: boolean;
  passingScore: number;
  attemptNumber: number;
}
