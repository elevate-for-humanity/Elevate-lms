/**
 * lib/course-builder/schema.ts
 * Single source of truth for the course builder pipeline.
 */
import { HVAC_COURSE_ID } from '@/lib/courses/hvac-uuids';
import type {
  LearningExperienceProfile,
  LearningPhase,
  MediaEvidencePolicy,
} from '@/lib/curriculum/learning-experience';
// BARBER_COURSE_ID not imported from @/lib/barber/constants — that module re-exports
// from this file, creating a circular dependency. Use the literal directly here.
const BARBER_COURSE_ID_SCHEMA = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

export type CredentialTarget =
  | 'INTERNAL'
  | 'STATE_BOARD'
  | 'IC&RC'
  | 'NAADAC'
  | 'CUSTOM'
  | 'DOL_APPRENTICESHIP';
export type LessonType =
  | 'video'
  | 'reading'
  | 'quiz'
  | 'assignment'
  | 'practical'
  | 'checkpoint'
  | 'exam'
  | 'live_session'
  | 'fieldwork'
  | 'observation'
  | 'lesson'
  | 'lab'
  | 'certification';
export type ActivityType =
  | 'video'
  | 'reading'
  | 'worksheet'
  | 'reflection'
  | 'upload'
  | 'checklist'
  | 'quiz'
  | 'observation'
  | 'discussion'
  | 'lab'
  | 'checkpoint'
  | 'practice';
export type RequiredArtifact =
  | 'text'
  | 'video'
  | 'audio'
  | 'checklist'
  | 'document'
  | 'image'
  | 'form';
export type HourCategory =
  | 'didactic'
  | 'practical'
  | 'clinical'
  | 'fieldwork'
  | 'observation'
  | 'supervision'
  | 'self_study'
  | 'exam';
export type AssessmentMethod = 'quiz' | 'lab' | 'exam' | 'observation' | 'assignment';

export type EvidenceType =
  | 'quiz'
  | 'upload'
  | 'video'
  | 'audio'
  | 'checklist'
  | 'observation'
  | 'attestation'
  | 'exam'
  | 'reflection';
export type DeliveryMethod =
  | 'online_async'
  | 'online_live'
  | 'in_person'
  | 'hybrid'
  | 'field_based';

export interface QuizQuestion {
  id: string;
  prompt: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'scenario';
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points?: number;
  domainKey?: string;
  competencyKeys?: string[];
}

export interface CompetencyCheck {
  key: string;
  label: string;
  requiresInstructorSignoff: boolean;
  isCritical: boolean;
  domainKey?: string;
  assessmentMethod?: AssessmentMethod;
  evidenceType?: EvidenceType;
}

export interface UnlockRule {
  type:
    | 'pass_assessment'
    | 'approved_submission'
    | 'complete_previous_module'
    | 'achieve_competency';
  minimumScore?: number;
  competencyKey?: string;
}

export interface FinalExamConfig {
  required: boolean;
  questionCount?: number;
  passingScore?: number;
  timeLimitMinutes?: number;
  domainDistribution?: Record<string, number>;
  competencyKeys?: string[];
}

export interface CertificateRequirements {
  includeHours: boolean;
  includeCompetencies: boolean;
  includeInstructorVerification: boolean;
  includeCompletionDate: boolean;
  includeVerificationUrl: boolean;
  requireAllCriticalCompetencies?: boolean;
}

export interface CertificateEvidence {
  hoursCompleted: number;
  competenciesAchieved: string[];
  criticalCompetenciesAchieved: string[];
  instructorVerified: boolean;
  finalExamScore?: number;
  completionDate: string;
}

export interface InstructorRequirement {
  required: boolean;
  roleTypes?: string[];
  approvalAuthority?: 'lesson' | 'module' | 'program';
  supervisionMethod?: 'live' | 'recorded' | 'document_review' | 'observation';
}

export interface ComplianceDomainRequirement {
  key: string;
  label: string;
  minimumHours?: number;
  minimumLessons?: number;
  required?: boolean;
  weightedExamCoverage?: number;
}

export interface ComplianceRuleSet {
  profileKey: string;
  profileLabel: string;
  credentialTarget: CredentialTarget;
  minimumProgramHours: number;
  requiresFinalExam: boolean;
  requirePassingScoresForAssessments: boolean;
  requireInstructorSignoffForPracticals: boolean;
  requireEvidenceForPracticals: boolean;
  requireDomainMapping: boolean;
  requireCompetencyMapping: boolean;
  requireCertificateVerification: boolean;
  requireHourCategory: boolean;
  requireDeliveryMethod: boolean;
  requireInstructorRequirements: boolean;
  requireFieldworkTracking: boolean;
  requireArtifactRules: boolean;
  requireRetentionPolicy: boolean;
  requiredDomains: ComplianceDomainRequirement[];
}

export interface RegulatoryMetadata {
  complianceProfileKey: string;
  credentialTarget: CredentialTarget;
  governingBody?: string | null;
  governingRegion?: string | null;
  governingStandardVersion?: string | null;
  retentionPolicyDays?: number | null;
  auditNotes?: string | null;
}

export interface BuilderLesson {
  id?: string;
  slug: string;
  title: string;
  orderIndex: number;
  lessonType: LessonType;
  durationMinutes: number;
  learningObjectives: string[];
  content: Record<string, unknown>;
  renderedHtml?: string | null;
  videoUrl?: string | null;
  videoConfig?: Record<string, unknown> | null;
  quizQuestions?: QuizQuestion[];
  passingScore?: number | null;
  competencyChecks?: CompetencyCheck[];
  instructorNotes?: string | null;
  practicalRequired?: boolean;
  requiredArtifacts?: RequiredArtifact[];
  unlockRule?: UnlockRule;
  activities?: Array<{ type: ActivityType; label: string; config?: Record<string, unknown> }>;
  isRequired?: boolean;
  aiGenerated?: boolean;
  approved?: boolean;
  locked?: boolean;
  generationStatus?:
    | 'draft'
    | 'structure_seeded'
    | 'content_hydrated'
    | 'assessment_ready'
    | 'verification_ready'
    | 'certificate_ready'
    | 'published';
  domainKey?: string | null;
  hourCategory?: HourCategory | null;
  evidenceType?: EvidenceType | null;
  deliveryMethod?: DeliveryMethod | null;
  requiresInstructorSignoff?: boolean;
  instructorRequirement?: InstructorRequirement | null;
  minimumSeatTimeMinutes?: number | null;
  fieldworkEligible?: boolean;
  /** Universal AI-generated course experience and publication evidence. */
  learningExperience?: {
    profile: LearningExperienceProfile;
    phases: Array<{ phase: LearningPhase; order: number; required: boolean }>;
    mediaPolicy: MediaEvidencePolicy;
  };
}

export interface BuilderModule {
  id?: string;
  slug: string;
  title: string;
  orderIndex: number;
  domainKey: string;
  targetHours: number;
  quizRequired: boolean;
  quizQuestionCount?: number;
  practicalRequired: boolean;
  lessons: BuilderLesson[];
  minimumPassingRate?: number | null;
  supervisedHoursRequired?: number | null;
  fieldworkHoursRequired?: number | null;
}

export interface ProgramBuilderTemplate {
  id?: string;
  programId?: string;
  courseId?: string;
  title: string;
  slug: string;
  credentialTarget: CredentialTarget;
  minimumHours: number;
  requiresFinalExam: boolean;
  finalExam: FinalExamConfig;
  certificateRequirements: CertificateRequirements;
  modules: BuilderModule[];
  status?: 'draft' | 'published';
  regulatory: RegulatoryMetadata;
}

// Legacy aliases — pipeline.ts / compiler.ts / validate.ts import these names.
// BuilderLesson / BuilderModule are the canonical interfaces; CourseLesson /
// CourseModule are the names used throughout the pipeline layer.
//
// content is overridden from Record<string,unknown> to string because the
// pipeline stores rendered HTML in course_lessons.content (text column).
export type CourseLesson = Omit<
  BuilderLesson,
  'content' | 'quizQuestions' | 'orderIndex' | 'lessonType'
> & {
  type: LessonType;
  order: number;
  orderIndex?: number;
  lessonType?: LessonType;
  description?: string;
  content?: string;
  partnerExamCode?: string;
  quizQuestions?: Array<{
    id?: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
};

export type CourseModule = Omit<BuilderModule, 'lessons'> & {
  order: number;
  lessons: CourseLesson[];
};

export type CourseTemplate = Omit<ProgramBuilderTemplate, 'modules'> & {
  programSlug: string;
  courseSlug: string;
  description?: string;
  modules: CourseModule[];
};

export const ASSESSED_LESSON_TYPES: LessonType[] = ['quiz', 'checkpoint', 'exam'];
export const CONTENT_LESSON_TYPES: LessonType[] = [
  'video',
  'reading',
  'lesson',
  'practical',
  'lab',
  'assignment',
  'checkpoint',
];
export const PRACTICAL_LESSON_TYPES: LessonType[] = [
  'practical',
  'lab',
  'assignment',
  'fieldwork',
  'observation',
];

export const DEFAULT_ACTIVITIES: Record<string, ActivityType[]> = {
  video: ['video', 'reading'],
  reading: ['reading'],
  lesson: ['video', 'reading'],
  quiz: ['quiz'],
  checkpoint: ['reading', 'quiz'],
  exam: ['quiz'],
  practical: ['reading', 'checklist', 'observation'],
  lab: ['reading', 'checklist', 'observation'],
  assignment: ['reading', 'upload'],
  live_session: ['video'],
  certification: ['reading'],
  fieldwork: ['checklist', 'observation'],
  observation: ['checklist', 'observation'],
};

/**
 * Static fallback map — used ONLY when the DB is unavailable (for example build
 * time or scripts without a DB client). Runtime resolution goes through
 * lib/course-builder/program-resolver.ts and canonical program/course links.
 *
 * Do not add new entries here. Register new program/course relationships through
 * the canonical Course Builder root action instead of adding another HTTP route.
 *
 * @deprecated Use resolveCourseIdFromDb() from program-resolver.ts at runtime.
 */
const _STATIC_COURSE_FALLBACK: Record<string, string> = {
  'barber-apprenticeship': BARBER_COURSE_ID_SCHEMA,
  'hvac-technician': HVAC_COURSE_ID,
};

/** @deprecated Runtime code must use resolveCourseIdFromDb() from program-resolver.ts */
export function resolveCourseId(programSlug: string): string | null {
  return _STATIC_COURSE_FALLBACK[programSlug] ?? null;
}
