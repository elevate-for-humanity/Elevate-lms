/**
 * Course Factory 2.1 - LMS Integration Layer
 * 
 * Bridges blueprints to learner experience.
 * Blueprint → API → Components → Learner Dashboard
 */
import type { CredentialBlueprint, BlueprintModule, InteractionSpecs } from '../blueprints/types';
import type { EnrollmentType } from '../blueprints/types';

// ─── Learner Context ────────────────────────────────────────────────────────────

export interface LearnerContext {
  learnerId: string;
  enrollmentId: string;
  programSlug: string;
  courseId: string;
  enrollmentType: EnrollmentType;
  startedAt: Date;
  lastActiveAt: Date;
}

// ─── Course Progress ────────────────────────────────────────────────────────────

export interface CourseProgress {
  courseId: string;
  learnerId: string;
  percentComplete: number;
  currentModuleSlug: string;
  currentLessonSlug: string;
  totalTimeSpent: number; // minutes
  completedLessons: number;
  totalLessons: number;
  completedModules: number;
  totalModules: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'dropped';
  lastActiveAt: Date;
}

export interface ModuleProgress {
  moduleSlug: string;
  moduleTitle: string;
  orderIndex: number;
  percentComplete: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizScores: QuizScore[];
  competencyProgress: Record<string, number>;
  startedAt: Date;
  completedAt?: Date;
}

export interface LessonProgress {
  lessonSlug: string;
  lessonTitle: string;
  order: number;
  percentComplete: number;
  timeSpent: number;
  completed: boolean;
  completedAt?: Date;
  interactionsCompleted: string[];
  interactionsTotal: number;
  knowledgeCheckScore?: number;
  flashcardMastery?: number;
}

export interface QuizScore {
  quizId: string;
  score: number;
  attempts: number;
  bestScore: number;
  passed: boolean;
}

// ─── Interaction Progress ────────────────────────────────────────────────────────

export interface InteractionProgress {
  interactionId: string;
  interactionType: InteractionType;
  lessonSlug: string;
  completed: boolean;
  score?: number;
  attempts: number;
  lastAttemptAt?: Date;
  completedAt?: Date;
  data?: Record<string, unknown>; // Type-specific data
}

export type InteractionType = 
  | 'knowledge-check'
  | 'flashcard'
  | 'scenario'
  | 'click-to-reveal'
  | 'drag-drop'
  | 'matching'
  | 'case-study'
  | 'simulation'
  | 'decision-tree'
  | 'video-question';

// ─── Competency Progress ───────────────────────────────────────────────────────

export interface CompetencyProgress {
  competencyKey: string;
  competencyName: string;
  currentLevel: number; // 0-100
  targetLevel: number;
  touchpoints: CompetencyTouchpoint[];
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  requiredSkills: number;
  completedSkills: number;
}

export interface CompetencyTouchpoint {
  type: 'lesson' | 'quiz' | 'lab' | 'scenario' | 'evaluation' | 'practice';
  sourceId: string;
  sourceTitle: string;
  score: number;
  maxScore: number;
  timestamp: Date;
}

// ─── Certification Readiness ───────────────────────────────────────────────────

export interface CertificationReadiness {
  certificationId: string;
  certificationName: string;
  readinessScore: number; // 0-100
  examEligible: boolean;
  practiceExamAverage?: number;
  lastPracticeExam?: Date;
  domainScores: DomainScore[];
  weakAreas: string[];
  recommendedFocus: RecommendedFocus[];
}

export interface DomainScore {
  domainKey: string;
  domainName: string;
  score: number;
  questionsAnswered: number;
  questionsCorrect: number;
  weight: number;
}

export interface RecommendedFocus {
  domainKey: string;
  lessonSlugs: string[];
  reason: string;
}

// ─── Practice Exam ─────────────────────────────────────────────────────────────

export interface PracticeExam {
  examId: string;
  title: string;
  type: 'full' | 'domain' | 'weak-area' | 'timed';
  certificationId: string;
  questionCount: number;
  timeLimit?: number;
  passingScore: number;
  domains: { domainKey: string; questionCount: number }[];
}

export interface PracticeExamAttempt {
  attemptId: string;
  examId: string;
  learnerId: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  timeSpent: number;
  answers: { questionId: string; selectedOption: number; correct: boolean }[];
  domainScores: { domainKey: string; score: number; correct: number; total: number }[];
  completedAt: Date;
}

// ─── Apprenticeship Progress ────────────────────────────────────────────────────

export interface ApprenticeshipProgress {
  enrollmentId: string;
  learnerId: string;
  programSlug: string;
  totalHoursRequired: number;
  rtiHours: RTIHours;
  ojlHours: OJIHours;
  competencyTracking: CompetencyProgress[];
  employerEvaluations: EmployerEvaluation[];
  skillSignoffs: SkillSignoff[];
  rapidsReporting?: RAPIDSReport;
  completionPercent: number;
  status: 'active' | 'completed' | 'dropped' | 'suspended';
}

export interface RTIHours {
  required: number;
  completed: number;
  remaining: number;
  byMonth: { month: string; hours: number }[];
  upcomingActivities: RTIActivity[];
}

export interface RTIActivity {
  id: string;
  name: string;
  type: 'online' | 'in-person' | 'lab' | 'exam';
  hoursCredit: number;
  scheduledDate?: Date;
  completed: boolean;
}

export interface OJIHours {
  required: number;
  completed: number;
  remaining: number;
  byMonth: { month: string; hours: number }[];
  verifiedTasks: OJITask[];
}

export interface OJITask {
  taskId: string;
  taskName: string;
  competencyKey: string;
  employerVerified: boolean;
  verifiedDate?: Date;
  employerName?: string;
}

export interface EmployerEvaluation {
  evaluationId: string;
  periodStart: Date;
  periodEnd: Date;
  overallRating: 1 | 2 | 3 | 4 | 5;
  competencyRatings: { competencyKey: string; rating: number }[];
  submittedAt: Date;
  employerName: string;
  status: 'pending' | 'submitted' | 'reviewed';
}

export interface SkillSignoff {
  skillKey: string;
  skillName: string;
  competencyKey: string;
  signedOff: boolean;
  signedOffBy?: string;
  signedOffAt?: Date;
  evidence?: string;
}

export interface RAPIDSReport {
  rapidsId: string;
  programCode: string;
  lastReportedAt: Date;
  nextReportDue: Date;
  status: 'current' | 'due' | 'overdue';
}

// ─── Learner Dashboard ─────────────────────────────────────────────────────────

export interface LearnerDashboard {
  learnerId: string;
  courseId: string;
  programSlug: string;
  enrollmentType: EnrollmentType;
  
  // Progress summary
  progress: CourseProgress;
  
  // Current focus
  currentModule: ModuleProgress;
  currentLesson: LessonProgress;
  
  // Up next
  nextLesson?: {
    slug: string;
    title: string;
    moduleSlug: string;
    estimatedMinutes: number;
  };
  
  // Competencies
  competencies: CompetencyProgress[];
  
  // Certification (if applicable)
  certification?: CertificationReadiness;
  
  // Practice exams
  practiceExams: PracticeExam[];
  recentAttempts: PracticeExamAttempt[];
  
  // Apprenticeship (if enrolled)
  apprenticeship?: ApprenticeshipProgress;
  
  // Gamification
  gamification: GamificationState;
  
  // Notifications
  notifications: NotificationSummary;
}

export interface GamificationState {
  xp: number;
  level: number;
  streak: {
    current: number;
    longest: number;
  };
  badges: EarnedBadge[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface EarnedBadge {
  id: string;
  name: string;
  description: string;
  earnedAt: Date;
  iconUrl: string;
}

export interface NotificationSummary {
  unread: number;
  recent: Notification[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  createdAt: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

// ─── Blueprint → Dashboard Transformer ─────────────────────────────────────────

/**
 * Transform a blueprint into learner-facing dashboard data
 */
export function blueprintToDashboard(
  blueprint: CredentialBlueprint,
  context: LearnerContext,
  progress: CourseProgress,
  moduleProgress: ModuleProgress[],
  lessonProgress: LessonProgress[],
  competencyProgress: CompetencyProgress[],
  certification?: CertificationReadiness,
  practiceExams?: PracticeExam[],
  apprenticeship?: ApprenticeshipProgress
): LearnerDashboard {
  const currentModule = moduleProgress.find(m => m.moduleSlug === progress.currentModuleSlug);
  const currentLesson = lessonProgress.find(l => l.lessonSlug === progress.currentLessonSlug);
  
  // Find next uncompleted lesson
  const nextLesson = findNextLesson(blueprint.modules, lessonProgress);
  
  // Calculate gamification
  const gamification = calculateGamification(progress, competencyProgress);
  
  return {
    learnerId: context.learnerId,
    courseId: context.courseId,
    programSlug: context.programSlug,
    enrollmentType: context.enrollmentType,
    progress,
    currentModule: currentModule || createEmptyModuleProgress(blueprint.modules[0]),
    currentLesson: currentLesson || createEmptyLessonProgress(blueprint.modules[0]?.lessons[0]),
    nextLesson,
    competencies: competencyProgress,
    certification,
    practiceExams: practiceExams || [],
    recentAttempts: [],
    apprenticeship: context.enrollmentType === 'apprentice' ? apprenticeship : undefined,
    gamification,
    notifications: { unread: 0, recent: [] },
  };
}

function findNextLesson(
  modules: BlueprintModule[],
  completedLessons: LessonProgress[]
): { slug: string; title: string; moduleSlug: string; estimatedMinutes: number } | undefined {
  for (const module of modules) {
    for (const lesson of module.lessons || []) {
      const completed = completedLessons.find(l => l.lessonSlug === lesson.slug);
      if (!completed?.completed) {
        return {
          slug: lesson.slug,
          title: lesson.title,
          moduleSlug: module.slug,
          estimatedMinutes: 15, // Default estimate
        };
      }
    }
  }
  return undefined;
}

function calculateGamification(
  progress: CourseProgress,
  competencies: CompetencyProgress[]
): GamificationState {
  const xpPerLesson = 50;
  const xpPerModule = 200;
  const xp = (progress.completedLessons * xpPerLesson) + (progress.completedModules * xpPerModule);
  const level = Math.floor(xp / 500) + 1;
  
  const avgCompetency = competencies.length > 0
    ? competencies.reduce((sum, c) => sum + c.currentLevel, 0) / competencies.length
    : 0;
  
  let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (avgCompetency >= 66) skillLevel = 'advanced';
  else if (avgCompetency >= 33) skillLevel = 'intermediate';
  
  return {
    xp,
    level,
    streak: { current: 0, longest: 0 },
    badges: [],
    skillLevel,
  };
}

function createEmptyModuleProgress(module?: BlueprintModule): ModuleProgress {
  return {
    moduleSlug: module?.slug || '',
    moduleTitle: module?.title || '',
    orderIndex: module?.orderIndex || 0,
    percentComplete: 0,
    lessonsCompleted: 0,
    totalLessons: module?.lessons?.length || 0,
    quizScores: [],
    competencyProgress: {},
    startedAt: new Date(),
  };
}

function createEmptyLessonProgress(lesson?: { slug: string; title: string }): LessonProgress {
  return {
    lessonSlug: lesson?.slug || '',
    lessonTitle: lesson?.title || '',
    order: 0,
    percentComplete: 0,
    timeSpent: 0,
    completed: false,
    interactionsCompleted: [],
    interactionsTotal: 0,
  };
}

// ─── Interaction Spec to Required Interactions ─────────────────────────────────

export interface RequiredInteraction {
  type: InteractionType;
  count: number;
  lessonSlug: string;
  position: 'inline' | 'checkpoint' | 'end';
}

export function getRequiredInteractions(
  module: BlueprintModule,
  lessonSlug: string
): RequiredInteraction[] {
  const specs = module.interactionSpecs;
  if (!specs) return [];
  
  const interactions: RequiredInteraction[] = [];
  
  if (specs.includeKnowledgeChecks) {
    for (let i = 0; i < specs.knowledgeCheckCount; i++) {
      interactions.push({
        type: 'knowledge-check',
        count: i + 1,
        lessonSlug,
        position: 'inline',
      });
    }
  }
  
  if (specs.includeScenarios) {
    for (let i = 0; i < specs.scenarioCount; i++) {
      interactions.push({
        type: 'scenario',
        count: i + 1,
        lessonSlug,
        position: 'checkpoint',
      });
    }
  }
  
  if (specs.includeFlashcards) {
    interactions.push({
      type: 'flashcard',
      count: specs.flashcardCount,
      lessonSlug,
      position: 'end',
    });
  }
  
  if (specs.includeClickToReveal) {
    interactions.push({
      type: 'click-to-reveal',
      count: 1,
      lessonSlug,
      position: 'inline',
    });
  }
  
  if (specs.includeDragDrop) {
    interactions.push({
      type: 'drag-drop',
      count: specs.matchingCount || 1,
      lessonSlug,
      position: 'inline',
    });
  }
  
  if (specs.includeMatching) {
    interactions.push({
      type: 'matching',
      count: specs.matchingCount || 1,
      lessonSlug,
      position: 'inline',
    });
  }
  
  if (specs.includeCaseStudies) {
    interactions.push({
      type: 'case-study',
      count: specs.caseStudyCount || 1,
      lessonSlug,
      position: 'checkpoint',
    });
  }
  
  if (specs.includeSimulations) {
    interactions.push({
      type: 'simulation',
      count: specs.simulationCount || 1,
      lessonSlug,
      position: 'end',
    });
  }
  
  if (specs.includeDecisionTrees) {
    interactions.push({
      type: 'decision-tree',
      count: 1,
      lessonSlug,
      position: 'checkpoint',
    });
  }
  
  return interactions;
}
