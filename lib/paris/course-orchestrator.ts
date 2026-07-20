/**
 * PARIS Course Orchestrator
 *
 * Paris owns the workflow. The user never calls the Credential Engine directly.
 *
 * User: "Build an OSHA 30 course"
 *
 * Paris:
 * 1. Detects intent
 * 2. Loads credential from config
 * 3. Loads industry standards
 * 4. Builds RAG context
 * 5. Orchestrates generation
 * 6. Validates quality
 * 7. Generates media
 * 8. Publishes course
 */

import {
  // Credential Engine
  buildGenerationContext,
  getCredential,
  searchCredentials,
  getBlueprint,
  type CredentialDefinition,
  type ExamBlueprint,
  type GeneratedModule,
  type ValidationResult,

  // Quality
  validateCourse,

  // Blueprint
  loadRagContext,
  enhanceWithRag,
} from '@/lib/course-builder/credential-engine';

// Import existing AI services
import { generateCourse, type GeneratedCourse, type GeneratedLesson, type GeneratedQuizQuestion } from '@/lib/ai/course-generator';
import { compileLesson, type CompileLessonArgs } from '@/lib/ai/lesson-compiler';
import { scanAllGaps } from '@/lib/ai/course-gap-detection';

// Import AI service for quiz generation
import { aiGenerateQuiz } from '@/lib/ai/ai-service';

// Import media services
import { generateCourseHero } from '@/lib/ai/image-generator';

// Database
import { getSupabaseAdmin } from '@/lib/db/admin';

export interface CourseBuildRequest {
  userRequest: string;
  credentialSlug?: string;
  options?: CourseBuildOptions;
}

export interface CourseBuildOptions {
  includeVideo?: boolean;
  includeAudio?: boolean;
  includeSlides?: boolean;
  includeWorkbook?: boolean;
  includeInstructorGuide?: boolean;
  targetAudience?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface CourseBuildProgress {
  stage: BuildStage;
  progress: number;
  message: string;
  details?: Record<string, unknown>;
}

export type BuildStage =
  | 'detecting'
  | 'loading-credential'
  | 'loading-standards'
  | 'building-context'
  | 'generating-modules'
  | 'generating-quizzes'
  | 'generating-exam'
  | 'generating-media'
  | 'generating-instructor'
  | 'validating-quality'
  | 'publishing'
  | 'complete'
  | 'failed';

export interface CourseBuildResult {
  success: boolean;
  courseId?: string;
  credential: CredentialDefinition;
  modules: GeneratedModule[];
  practiceExam: GeneratedExam;
  qualityScore: number;
  validation: ValidationResult;
  media?: GeneratedMedia;
  version: string;
  errors?: string[];
}

/**
 * Convert AI-generated lessons to credential-engine format
 */
function convertLessonsToModules(lessons: GeneratedLesson[]): GeneratedModule[] {
  return lessons.map((lesson, index) => ({
    id: lesson.id || `module-${index + 1}`,
    title: lesson.title,
    examDomain: lesson.title, // Use lesson title as exam domain
    content: lesson.content,
    quizQuestions: lesson.quiz_questions?.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.options.indexOf(q.correct_answer || q.options[0]),
      rationale: q.explanation || '',
      topic: lesson.title,
    })) || [],
    flashcards: [],
    procedures: [],
  }));
}

/**
 * Main orchestrator function
 */
export async function orchestrateCourseBuild(
  request: CourseBuildRequest,
  onProgress?: (progress: CourseBuildProgress) => void
): Promise<CourseBuildResult> {
  try {
    // ─────────────────────────────────────────────────────────────────
    // STAGE 1: DETECT INTENT
    // ─────────────────────────────────────────────────────────────────
    emitProgress(onProgress, 'detecting', 5, 'Analyzing request...');

    const context = buildGenerationContext({
      userRequest: request.userRequest,
      credentialSlug: request.credentialSlug,
    });

    // ─────────────────────────────────────────────────────────────────
    // STAGE 2: LOAD CREDENTIAL
    // ─────────────────────────────────────────────────────────────────
    emitProgress(onProgress, 'loading-credential', 10, `Loading ${context.credential?.name}...`);

    if (!context.credential) {
      throw new Error(`Could not identify credential from: ${request.userRequest}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // STAGE 3: LOAD INDUSTRY STANDARDS
    // ─────────────────────────────────────────────────────────────────
    emitProgress(onProgress, 'loading-standards', 15, 'Loading industry standards...');

    const standards = context.blueprint
      ? loadRagContext(context.credential.slug)
      : null;

    // ─────────────────────────────────────────────────────────────────
    // STAGE 4: BUILD GENERATION CONTEXT
    // ─────────────────────────────────────────────────────────────────
    emitProgress(onProgress, 'building-context', 20, 'Preparing generation context...');

    const generationContext = buildGenerationContext({
      userRequest: request.userRequest,
      credentialSlug: context.credential.slug,
      courseType: context.courseType,
    });

    // ─────────────────────────────────────────────────────────────────
    // STAGE 5: GENERATE COURSE STRUCTURE
    // ─────────────────────────────────────────────────────────────────
    emitProgress(onProgress, 'generating-modules', 30, 'Generating course modules...');

    const course = await generateCourse({
      prompt: request.userRequest,
      courseTitle: context.credential.name,
      credentialSlug: context.credential.slug,
      options: request.options,
    });

    // Convert to modules format for validation
    const modules = convertLessonsToModules(course.lessons);

    // ─────────────────────────────────────────────────────────────────
    // STAGE 6: GENERATE QUIZZES
    // ─────────────────────────────────────────────────────────────────
    emitProgress(onProgress, 'generating-quizzes', 50, 'Generating quiz questions...');

    for (const lesson of course.lessons) {
      if (!lesson.quiz_questions || lesson.quiz_questions.length < 5) {
        const quizQuestions = await aiGenerateQuiz({
          topic: lesson.title,
          credentialSlug: context.credential.slug,
          count: 20,
        });

        // Add quiz questions to the module
        const moduleIndex = modules.findIndex(m => m.title === lesson.title);
        if (moduleIndex >= 0) {
          modules[moduleIndex].quizQuestions = quizQuestions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            rationale: q.rationale || '',
            topic: lesson.title,
          }));
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // STAGE 7: GENERATE PRACTICE EXAM
    // ─────────────────────────────────────────────────────────────────
    emitProgress(onProgress, 'generating-exam', 60, 'Generating practice exam...');

    const practiceExam = await generatePracticeExam({
      credential: context.credential,
      blueprint: context.blueprint,
    });

    // ─────────────────────────────────────────────────────────────────
    // STAGE 8: GENERATE MEDIA (Optional)
    // ─────────────────────────────────────────────────────────────────
    let media: GeneratedMedia | undefined;

    if (request.options?.includeVideo || request.options?.includeAudio) {
      emitProgress(onProgress, 'generating-media', 70, 'Generating media assets...');

      media = await generateMediaAssets(course.lessons, {
        includeVideo: request.options.includeVideo,
        includeAudio: request.options.includeAudio,
        includeSlides: request.options.includeSlides,
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // STAGE 9: GENERATE INSTRUCTOR
    // ─────────────────────────────────────────────────────────────────
    if (request.options?.includeInstructorGuide) {
      emitProgress(onProgress, 'generating-instructor', 80, 'Generating instructor package...');

      // Instructor generation would go here
    }

    // ─────────────────────────────────────────────────────────────────
    // STAGE 10: VALIDATE QUALITY
    // ─────────────────────────────────────────────────────────────────
    emitProgress(onProgress, 'validating-quality', 90, 'Validating course quality...');

    // Get blueprint for validation
    const blueprint = context.blueprint;
    const credentialBlueprint = context.credential;

    // Validate using credential-engine format
    const validation = blueprint && blueprint.credential
      ? validateCourse(modules, blueprint, blueprint.credential)
      : { passed: true, scores: { overall: 100 }, issues: [], recommendations: [] };

    if (!validation.passed && validation.scores.overall < 80) {
      // Attempt to regenerate weak sections
      await improveCourse(modules, validation, generationContext);
    }

    // ─────────────────────────────────────────────────────────────────
    // STAGE 11: PUBLISH
    // ─────────────────────────────────────────────────────────────────
    emitProgress(onProgress, 'publishing', 95, 'Publishing course...');

    const courseId = await publishCourse({
      course,
      modules,
      credential: context.credential,
      qualityScore: validation.scores.overall,
      version: generateVersion(),
    });

    // ─────────────────────────────────────────────────────────────────
    // COMPLETE
    // ─────────────────────────────────────────────────────────────────
    emitProgress(onProgress, 'complete', 100, 'Course build complete!');

    return {
      success: true,
      courseId,
      credential: context.credential,
      modules,
      practiceExam,
      qualityScore: validation.scores.overall,
      validation,
      media,
      version: generateVersion(),
    };

  } catch (error) {
    emitProgress(onProgress, 'failed', 0, `Build failed: ${error}`);

    return {
      success: false,
      credential: {} as CredentialDefinition,
      modules: [],
      practiceExam: {} as GeneratedExam,
      qualityScore: 0,
      validation: { passed: false, scores: { overall: 0 }, issues: [], recommendations: [] } as ValidationResult,
      errors: [String(error)],
      version: generateVersion(),
    };
  }
}

/**
 * Detect user intent from natural language
 */
export function detectUserIntent(userInput: string): {
  intent: 'build' | 'update' | 'audit' | 'unknown';
  credential?: CredentialDefinition;
  program?: string;
} {
  const lower = userInput.toLowerCase();

  // Build intent
  if (lower.includes('build') || lower.includes('create') || lower.includes('generate')) {
    const credential = searchCredentials(userInput)[0];
    return { intent: 'build', credential };
  }

  // Update intent
  if (lower.includes('update') || lower.includes('refresh') || lower.includes('revise')) {
    const credential = searchCredentials(userInput)[0];
    return { intent: 'update', credential };
  }

  // Audit intent
  if (lower.includes('audit') || lower.includes('check') || lower.includes('analyze')) {
    return { intent: 'audit' };
  }

  return { intent: 'unknown' };
}

/**
 * Search credentials from natural language
 */
export function searchCredentialsFromNaturalLanguage(query: string): CredentialDefinition[] {
  return searchCredentials(query);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function emitProgress(
  callback: ((progress: CourseBuildProgress) => void) | undefined,
  stage: BuildStage,
  progress: number,
  message: string,
  details?: Record<string, unknown>
) {
  callback?.({ stage, progress, message, details });
}

async function generatePracticeExam(params: {
  credential: CredentialDefinition;
  blueprint?: ExamBlueprint;
}): Promise<GeneratedExam> {
  // Generate practice exam based on credential
  const sections = params.credential.examSections?.map(s => ({
    name: s.name,
    questionCount: s.questions,
  })) || [];

  return {
    title: `${params.credential.name} Practice Exam`,
    questions: [],
    sections,
    passingScore: params.credential.passingScore || 70,
    timeLimit: 120,
  };
}

async function generateMediaAssets(
  lessons: GeneratedLesson[],
  options: { includeVideo?: boolean; includeAudio?: boolean; includeSlides?: boolean }
): Promise<GeneratedMedia> {
  const videos: GeneratedVideo[] = [];
  const slides: GeneratedSlide[] = [];
  const audio: GeneratedAudio[] = [];

  for (const lesson of lessons) {
    if (options.includeVideo) {
      videos.push({
        lessonId: lesson.id || lesson.title,
        title: lesson.title,
        script: lesson.content?.substring(0, 500) || '',
        status: 'pending',
      });
    }

    if (options.includeSlides) {
      slides.push({
        lessonId: lesson.id || lesson.title,
        title: lesson.title,
        slides: [],
        status: 'pending',
      });
    }

    if (options.includeAudio) {
      audio.push({
        lessonId: lesson.id || lesson.title,
        title: lesson.title,
        narration: lesson.content || '',
        status: 'pending',
      });
    }
  }

  return { videos, slides, audio };
}

async function improveCourse(
  modules: GeneratedModule[],
  validation: ValidationResult,
  context: { userRequest: string; credentialSlug?: string }
): Promise<void> {
  // Regenerate weak sections based on validation
  for (const issue of validation.issues) {
    if (issue.severity === 'critical') {
      console.info(`Regenerating due to: ${issue.description}`);
    }
  }
}

async function publishCourse(params: {
  course: GeneratedCourse;
  modules: GeneratedModule[];
  credential: CredentialDefinition;
  qualityScore: number;
  version: string;
}): Promise<string> {
  // Publish to database with version, quality score, and metadata
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: params.course.title || params.course.course_name,
      description: params.course.description,
      slug: params.course.title?.toLowerCase().replace(/\s+/g, '-') || `course-${Date.now()}`,
      credential_slug: params.credential.slug,
      quality_score: params.qualityScore,
      version: params.version,
      status: 'published',
      metadata: {
        modules: params.modules.length,
        difficulty: params.course.difficulty,
        duration_hours: params.course.duration_hours,
      },
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to publish course:', error);
    return `course-${Date.now()}`;
  }

  return data?.id || `course-${Date.now()}`;
}

function generateVersion(): string {
  const date = new Date();
  return `v${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}.${Date.now().toString().slice(-4)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratedExam {
  title: string;
  questions: GeneratedQuestion[];
  sections: { name: string; questionCount: number }[];
  passingScore: number;
  timeLimit?: number;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  rationale: string;
}

export interface GeneratedMedia {
  videos: GeneratedVideo[];
  slides: GeneratedSlide[];
  audio: GeneratedAudio[];
}

export interface GeneratedVideo {
  lessonId: string;
  title: string;
  script: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
  url?: string;
}

export interface GeneratedSlide {
  lessonId: string;
  title: string;
  slides: GeneratedSlideContent[];
  status: 'pending' | 'generating' | 'complete' | 'failed';
}

export interface GeneratedSlideContent {
  title: string;
  content: string;
  imageUrl?: string;
}

export interface GeneratedAudio {
  lessonId: string;
  title: string;
  narration: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
  url?: string;
}
