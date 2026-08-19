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

/**
 * Curriculum metadata for registered apprenticeships.
 *
 * This describes how a course maps to a registered occupation. It does not own
 * the DOL standard. Runtime compliance requirements are resolved through the
 * registered-program contract. Competency-based occupations deliberately have
 * no fixed OJL completion denominator.
 */
export type BlueprintApprenticeshipConfig = {
  approach: 'competency_based' | 'time_based' | 'hybrid';
  rtiHours: number;
  competencyCount: number;
  rapidsProgramCode: string;
  registeredProgramSlug: string;
  fixedOjlCompletionHours: number | null;
  /** @deprecated Historical compatibility only. Do not use for completion logic. */
  totalHours?: number;
  /** @deprecated Historical compatibility only. Do not use for competency-based completion logic. */
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
  type?: string;
  isRequired?: boolean;
  approved?: boolean;
  [key: string]: unknown;
};

export type BlueprintModuleRef = {
  slug: string;
  title: string;
  orderIndex: number;
  domainKey?: string;
  minLessons?: number;
  maxLessons?: number;
  quizRequired?: boolean;
  practicalRequired?: boolean;
  isCritical?: boolean;
  requiredLessonTypes?: Array<{ lessonType: string; requiredCount: number }>;
  competencies?: Array<{ competencyKey: string; isCritical?: boolean; minimumTouchpoints?: number }>;
  lessons: BlueprintLessonRef[];
  [key: string]: unknown;
};

export type BlueprintVideoConfig = {
  videoGenerator?: string;
  template?: string;
  instructorName?: string;
  instructorTitle?: string;
  instructorImagePath?: string;
  topBarColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  ttsVoice?: string;
  ttsSpeed?: number;
  slideCount?: number;
  segments?: string[];
  generateDalleImage?: boolean;
  dalleImageStyle?: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
};

export type CredentialBlueprint = {
  id: string;
  version: string;
  credentialSlug: string;
  credentialTitle: string;
  credentialCode?: string;
  state?: string;
  programSlug?: string;
  trackVariants?: string[];
  status?: string;
  skipLqs?: boolean;
  generationRules?: Record<string, unknown>;
  expectedModuleCount?: number;
  expectedLessonCount?: number;
  videoConfig?: BlueprintVideoConfig;
  assessmentRules?: Array<Record<string, unknown>>;
  modules: BlueprintModuleRef[];
  apprenticeshipConfig?: BlueprintApprenticeshipConfig;
  certificationPathway?: BlueprintCertificationPathway;
  [key: string]: unknown;
};
