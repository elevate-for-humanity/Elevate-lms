/**
 * types.ts
 * Unified type definitions for the Course Factory.
 */
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
export type {
  BlueprintLessonRef,
  BlueprintModule,
  BlueprintQuizQuestion,
  CredentialBlueprint,
} from '@/lib/curriculum/blueprints/types';

export type BuildMode = 'replace' | 'missing-only' | 'refresh';
export type VideoMode = 'queue' | 'off';
export type ContentSource = 'ai' | 'blueprint' | 'curriculum_lessons';
export type PublishStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'lesson' | 'checkpoint' | 'quiz' | 'exam' | 'lab' | 'assignment';

export interface FactoryInput {
  /** Required when upgrading an already-persisted authored curriculum. */
  courseId?: string;
  programId?: string;
  programSlug?: string;
  blueprint?: CredentialBlueprint;
  title?: string;
  topic?: string;
  audience?: string;
  state?: string;
  credential?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  hours?: number;
  deliveryFormat?: string;
  additionalRequirements?: string;
  moduleCount?: number;
  lessonsPerModule?: number;
  mode?: BuildMode;
  contentSource?: ContentSource;
  videoMode?: VideoMode;
  videoQueueLimit?: number | null;
  dryRun?: boolean;
}

export interface FactoryOutput {
  ok: boolean;
  courseId?: string;
  courseSlug?: string;
  title?: string;
  moduleCount?: number;
  lessonCount?: number;
  expectedLessonCount?: number;
  completionRatio?: number;
  skippedCount?: number;
  assessmentsGenerated?: number;
  /** Total media jobs queued by this build (lesson videos + microclips). */
  videosQueued?: number;
  /** Full-length lesson video jobs queued by this build. */
  lessonVideosQueued?: number;
  /** Short concept-clip jobs queued by this build. */
  microclipsQueued?: number;
  generationFailures?: Array<{ slug: string; reason: string }>;
  warnings?: string[];
  errors?: string[];
  status?: FactoryStatus;
  dryRun?: boolean;
}

export type FactoryStatus =
  | 'success'
  | 'not_found'
  | 'no_blueprint'
  | 'incomplete'
  | 'validation_failed'
  | 'db_error';

export type FactoryStage =
  | 'init'
  | 'resolve'
  | 'blueprint'
  | 'enrich'
  | 'assess'
  | 'validate'
  | 'publish'
  | 'media'
  | 'complete'
  | 'error';

export type ProgressCallback = (stage: FactoryStage, message: string, progress?: number) => void;

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

export interface KnowledgeCheck {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: number | string;
  explanation: string;
  points: number;
}

export interface InteractiveScenario {
  id: string;
  title: string;
  question: string;
  options: { id: string; text: string; isCorrect: boolean; feedback: string }[];
  competencies: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export type CredentialLevel = 'certificate' | 'diploma' | 'degree' | 'certification' | 'license';

export interface BlueprintVideoConfig {
  provider: 'local' | 'mux' | 'youtube' | 'vimeo';
  autoGenerate?: boolean;
  thumbnail?: boolean;
}

export interface CourseOutline {
  title: string;
  description: string;
  modules: CourseModuleOutline[];
}

export interface CourseModuleOutline {
  title: string;
  description?: string;
  lessons: CourseLessonOutline[];
}

export interface CourseLessonOutline {
  title: string;
  type: LessonType;
  duration?: number;
  description?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  status: PublishStatus;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  title: string;
  courseId: string;
  order: number;
  lessons?: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  title: string;
  moduleId: string;
  type: LessonType;
  order: number;
  content?: string;
}

export interface AssessmentConfig {
  type: 'quiz' | 'exam' | 'practical';
  passingScore: number;
  timeLimit?: number;
  questions: QuizQuestion[];
}
