/** Canonical credential-blueprint types shared by generator, auditor, and seeded curricula. */

export type EnrollmentType = 'standard' | 'apprentice' | 'employer-sponsored' | 'workforce-funded' | string;

export type InteractionSpecs = {
  includeKnowledgeChecks?: boolean;
  knowledgeCheckCount?: number;
  includeScenarios?: boolean;
  scenarioCount?: number;
  includeFlashcards?: boolean;
  flashcardCount?: number;
  includeClickToReveal?: boolean;
  includeDragDrop?: boolean;
  includeMatching?: boolean;
  matchingCount?: number;
  includeCaseStudies?: boolean;
  caseStudyCount?: number;
  includeSimulations?: boolean;
  simulationCount?: number;
  includeDecisionTrees?: boolean;
  decisionTreeCount?: number;
  [key: string]: unknown;
};

/** Curriculum metadata only. Runtime compliance is owned by the registered-program contract. */
export type BlueprintApprenticeshipConfig = {
  approach: 'competency_based' | 'time_based' | 'hybrid';
  rtiHours: number;
  competencyCount: number;
  rapidsProgramCode: string;
  registeredProgramSlug: string;
  fixedOjlCompletionHours: number | null;
  /** @deprecated Historical compatibility only; never use as competency-based completion logic. */
  totalHours?: number;
  /** @deprecated Historical compatibility only; never use as competency-based completion logic. */
  ojlHours?: number;
  [key: string]: unknown;
};

export type BlueprintCertificationPathway = {
  certificationBodyId: string;
  certificationName?: string;
  examCode?: string;
  [key: string]: unknown;
};

export type BlueprintQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  [key: string]: unknown;
};

export type BlueprintCompetencyCheck = {
  key: string;
  label: string;
  description?: string;
  isCritical?: boolean;
  requiresInstructorSignoff?: boolean;
  [key: string]: unknown;
};

export type BlueprintLessonRef = {
  slug: string;
  title: string;
  order: number;
  domainKey?: string;
  competencyKeys?: string[];
  objective?: string;
  learningObjectives?: string[];
  content?: string;
  quizQuestions?: BlueprintQuizQuestion[];
  passingScore?: number;
  durationMinutes?: number;
  videoFile?: string;
  partnerExamCode?: string;
  instructorNotes?: string | string[];
  competencyChecks?: Array<string | BlueprintCompetencyCheck>;
  [key: string]: unknown;
};

export type BlueprintCompetency = {
  competencyKey: string;
  isCritical: boolean;
  minimumTouchpoints: number;
  assessmentMethod?: 'quiz' | 'lab' | 'exam' | 'observation' | 'assignment';
  domainKey?: string;
  requiresInstructorSignoff?: boolean;
  [key: string]: unknown;
};

export type BlueprintLessonTypeRule = {
  lessonType: string;
  requiredCount: number;
  [key: string]: unknown;
};

export type BlueprintModule = {
  slug: string;
  title: string;
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
  interactionSpecs?: InteractionSpecs;
  [key: string]: unknown;
};

export type BlueprintAssessmentRule = {
  assessmentType: 'module' | 'type_specific' | 'universal_review' | 'final';
  scope: string;
  minQuestions: number;
  maxQuestions: number;
  passingThreshold: number;
  distributionConstraints?: Record<string, number>;
  [key: string]: unknown;
};

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
  [key: string]: unknown;
};

export type BlueprintFinalExamConfig = {
  questionCount: number;
  passingScore: number;
  domainDistribution?: Record<string, number>;
  [key: string]: unknown;
};

export type BlueprintCertificateRequirements = {
  includeHours: boolean;
  includeCompetencies: boolean;
  includeInstructorVerification: boolean;
  includeCompletionDate?: boolean;
  includeVerificationUrl?: boolean;
  requireAllCriticalCompetencies?: boolean;
  [key: string]: unknown;
};

export type BlueprintVideoConfig = {
  videoGenerator: 'runway' | 'remotion' | 'canvas-slides' | 'manual';
  template:
    | 'elevate-slide'
    | 'trade-demonstration'
    | 'talking-head'
    | 'screencast'
    | 'custom';
  instructorName: string;
  instructorTitle: string;
  instructorImagePath: string;
  brandName?: string;
  brandColor?: string;
  topBarColor?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  logoPath?: string;
  backgroundMusic?: boolean;
  captions?: boolean;
  [key: string]: unknown;
};

export type BlueprintExternalCourse = {
  provider?: string;
  title?: string;
  url?: string;
  courseId?: string;
  examCode?: string;
  required?: boolean;
  notes?: string;
  [key: string]: unknown;
};

export type BlueprintAuditViolation = {
  code: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
  path?: string;
  [key: string]: unknown;
};

export type BlueprintAuditResult = {
  ok: boolean;
  violations: BlueprintAuditViolation[];
  warnings?: BlueprintAuditViolation[];
  score?: number;
  [key: string]: unknown;
};

export type CredentialBlueprint = {
  id: string;
  programSlug: string;
  credentialSlug: string;
  credentialTitle: string;
  credentialCode: string;
  state: string;
  status: string;
  version: string;
  expectedModuleCount: number;
  expectedLessonCount: number;
  modules: BlueprintModule[];
  assessmentRules: BlueprintAssessmentRule[];
  generationRules: BlueprintGenerationRules;
  title?: string;
  sourceAuthority?: string;
  sourceReference?: string;
  effectiveDate?: string;
  programType?: string;
  targetRole?: string;
  finalExam?: BlueprintFinalExamConfig;
  certificateRequirements?: BlueprintCertificateRequirements;
  videoConfig?: BlueprintVideoConfig;
  externalCourses?: BlueprintExternalCourse[];
  apprenticeshipConfig?: BlueprintApprenticeshipConfig;
  certificationPathway?: BlueprintCertificationPathway;
  [key: string]: unknown;
};
