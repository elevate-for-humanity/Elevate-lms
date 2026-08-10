/** Canonical credential-blueprint types shared by generator, auditor, and seeded curricula. */

export type BlueprintQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

export type BlueprintCompetencyCheck = {
  key: string;
  label: string;
  description?: string;
  isCritical?: boolean;
  requiresInstructorSignoff?: boolean;
};

export type BlueprintLessonRef = {
  slug: string;
  title: string;
  order: number;
  domainKey: string;
  competencyKeys?: string[];
  objective?: string;
  /** Newer barber curricula carry a list in addition to the canonical objective. */
  learningObjectives?: string[];
  content?: string;
  quizQuestions?: BlueprintQuizQuestion[];
  passingScore?: number;
  durationMinutes?: number;
  videoFile?: string;
  partnerExamCode?: string;
  /** Accept both legacy single-note payloads and the canonical list. */
  instructorNotes?: string | string[];
  /** Practical curricula may use either labels or structured sign-off checks. */
  competencyChecks?: Array<string | BlueprintCompetencyCheck>;
};

export type BlueprintCompetency = {
  competencyKey: string;
  isCritical: boolean;
  minimumTouchpoints: number;
  assessmentMethod?: 'quiz' | 'lab' | 'exam' | 'observation' | 'assignment';
  domainKey?: string;
  requiresInstructorSignoff?: boolean;
};

export type BlueprintLessonTypeRule = {
  lessonType: string;
  requiredCount: number;
};

export type BlueprintModule = {
  slug: string;
  title: string;
  orderIndex: number;
  minLessons: number;
  maxLessons: number;
  quizRequired: boolean;
  practicalRequired: boolean;
  isCritical: boolean;
  requiredLessonTypes: BlueprintLessonTypeRule[];
  competencies: BlueprintCompetency[];
  suggestedLessonSkeleton?: string[];
  lessons?: BlueprintLessonRef[];
  domainKey?: string;
  /** Optional interaction metadata used by interactive lesson blueprints. */
  interactionSpecs?: unknown[];
};

export type BlueprintAssessmentRule = {
  assessmentType: 'module' | 'type_specific' | 'universal_review' | 'final';
  scope: string;
  minQuestions: number;
  maxQuestions: number;
  passingThreshold: number;
  distributionConstraints?: Record<string, number>;
};

/**
 * Generation policy supports both the canonical generator controls and the
 * earlier bounds-based curriculum format. They describe the same build intent
 * and are normalized by the generator at runtime.
 */
export type BlueprintGenerationRules = {
  allowRemediation?: boolean;
  allowExpansionLessons?: boolean;
  maxTotalLessons?: number;
  requiresFinalExam?: boolean;
  requiresUniversalReview?: boolean;
  generatorMode?: 'fixed' | 'flexible';
  minModules?: number;
  maxModules?: number;
  minLessonsPerModule?: number;
  maxLessonsPerModule?: number;
  requireCheckpointPerModule?: boolean;
  requireFinalExam?: boolean;
  passingScore?: number;
  allowedLessonTypes?: string[];
};

export type BlueprintFinalExamConfig = {
  questionCount: number;
  passingScore: number;
  domainDistribution?: Record<string, number>;
};

export type BlueprintCertificateRequirements = {
  includeHours: boolean;
  includeCompetencies: boolean;
  includeInstructorVerification: boolean;
};

export type BlueprintVideoConfig = {
  videoGenerator: 'runway' | 'canvas-slides' | 'manual';
  template: 'elevate-slide' | 'talking-head' | 'screencast' | 'custom';
  instructorName: string;
  instructorTitle: string;
  instructorImagePath: string;
  topBarColor: string;
  accentColor: string;
  backgroundColor: string;
  ttsVoice: 'onyx' | 'alloy' | 'echo' | 'fable' | 'nova' | 'shimmer';
  ttsSpeed: number;
  slideCount: 5;
  segments: ['intro', 'concept', 'visual', 'application', 'wrapup'];
  generateDalleImage: boolean;
  dalleImageStyle: 'natural' | 'vivid';
  /** Resolution was added after the earliest blueprints; generator supplies defaults. */
  width?: 1920;
  height?: 1080;
};

export type CredentialBlueprint = {
  id: string;
  version: string;
  credentialSlug: string;
  credentialTitle: string;
  state: string;
  programSlug: string;
  credentialCode: string;
  certiportExamCodes?: string[];
  externalCourses?: Array<{
    title: string;
    provider: string;
    url: string;
    required: boolean;
  }>;
  socCode?: string;
  trackVariants: string[];
  status: 'active' | 'draft' | 'archived';
  credentialTarget?: 'IC&RC' | 'NAADAC' | 'STATE_BOARD' | 'DOL_APPRENTICESHIP' | 'INTERNAL';
  minimumHours?: number;
  requiresFinalExam?: boolean;
  finalExam?: BlueprintFinalExamConfig;
  certificateRequirements?: BlueprintCertificateRequirements;
  generationRules: BlueprintGenerationRules;
  skipLqs?: boolean;
  expectedModuleCount: number;
  expectedLessonCount: number;
  modules: BlueprintModule[];
  assessmentRules?: BlueprintAssessmentRule[];
  videoConfig?: BlueprintVideoConfig;
  certificationPathway?: {
    certificationBodyId: string;
    credentialName: string;
    credentialAbbrev: string;
    examFeeCents?: number;
    feePayer?: 'student' | 'elevate' | 'grant';
    eligibilityReview?: boolean;
    isPrimary?: boolean;
  };
  contentSource?: 'blueprint' | 'curriculum_lessons';
};

export type BlueprintAuditViolation = {
  severity: 'error' | 'warning';
  moduleSlug?: string;
  rule: string;
  detail: string;
};

export type BlueprintAuditResult = {
  blueprintSlug: string;
  passed: boolean;
  violations: BlueprintAuditViolation[];
  warnings: BlueprintAuditViolation[];
};
