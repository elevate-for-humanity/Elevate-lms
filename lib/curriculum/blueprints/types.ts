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
  /** Optional module summary persisted by the publisher when a blueprint provides one. */
  description?: string;
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
  brandName?: string;
  brandColor?: string;
  logoPath?: string;
  backgroundMusic?: boolean;
  captions?: boolean;
};

export type CredentialBlueprint = {
  id: string;
  programSlug: string;
  credentialSlug: string;
  title: string;
  version: string;
  sourceAuthority: string;
  sourceReference: string;
  effectiveDate: string;
  programType: string;
  targetRole: string;
  expectedModuleCount: number;
  expectedLessonCount: number;
  modules: BlueprintModule[];
  assessmentRules: BlueprintAssessmentRule[];
  generationRules: BlueprintGenerationRules;
  finalExam?: BlueprintFinalExamConfig;
  certificateRequirements?: BlueprintCertificateRequirements;
  videoConfig?: BlueprintVideoConfig;
};
