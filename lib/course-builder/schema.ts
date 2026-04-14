/**
 * lib/course-builder/schema.ts
 * Single source of truth for the course builder pipeline.
 */

export type CredentialTarget = 'INTERNAL' | 'STATE_BOARD' | 'IC&RC' | 'NAADAC' | 'CUSTOM' | 'DOL_APPRENTICESHIP';
export type LessonType = 'video' | 'reading' | 'quiz' | 'assignment' | 'practical' | 'checkpoint' | 'exam' | 'live_session' | 'fieldwork' | 'observation' | 'lesson' | 'lab' | 'certification';
export type ActivityType = 'video' | 'reading' | 'worksheet' | 'reflection' | 'upload' | 'checklist' | 'quiz' | 'observation' | 'discussion' | 'lab';
export type RequiredArtifact = 'text' | 'video' | 'audio' | 'checklist' | 'document' | 'image' | 'form';
export type HourCategory = 'didactic' | 'practical' | 'clinical' | 'fieldwork' | 'observation' | 'supervision' | 'self_study' | 'exam';
export type EvidenceType = 'quiz' | 'upload' | 'video' | 'audio' | 'checklist' | 'observation' | 'attestation' | 'exam' | 'reflection';
export type DeliveryMethod = 'online_async' | 'online_live' | 'in_person' | 'hybrid' | 'field_based';

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
  assessmentMethod?: 'quiz' | 'lab' | 'exam' | 'observation' | 'assignment';
  evidenceType?: EvidenceType;
}

export interface UnlockRule {
  type: 'pass_assessment' | 'approved_submission' | 'complete_previous_module' | 'achieve_competency';
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
  generationStatus?: 'draft' | 'structure_seeded' | 'content_hydrated' | 'assessment_ready' | 'verification_ready' | 'certificate_ready' | 'published';
  domainKey?: string | null;
  hourCategory?: HourCategory | null;
  evidenceType?: EvidenceType | null;
  deliveryMethod?: DeliveryMethod | null;
  requiresInstructorSignoff?: boolean;
  instructorRequirement?: InstructorRequirement | null;
  minimumSeatTimeMinutes?: number | null;
  fieldworkEligible?: boolean;
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

// Legacy alias keeps pipeline.ts / compiler.ts / validate.ts working
export type CourseTemplate = ProgramBuilderTemplate & {
  programSlug: string;
  courseSlug: string;
  description?: string;
};

export const ASSESSED_LESSON_TYPES: LessonType[] = ['quiz', 'checkpoint', 'exam'];
export const CONTENT_LESSON_TYPES: LessonType[] = ['video', 'reading', 'lesson', 'practical', 'lab', 'assignment', 'checkpoint'];
export const PRACTICAL_LESSON_TYPES: LessonType[] = ['practical', 'lab', 'assignment', 'fieldwork', 'observation'];

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

export const PROGRAM_COURSE_MAP: Record<string, string> = {
  'barber-apprenticeship': '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
  'hvac-technician': 'f0593164-55be-5867-98e7-8a86770a8dd0',
};

export function resolveCourseId(programSlug: string): string | null {
  return PROGRAM_COURSE_MAP[programSlug] ?? null;
}
