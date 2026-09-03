/**
 * Course Builder Integration Layer
 * 
 * Wires the Credential Intelligence Engine to existing AI services.
 * This is the bridge between what we built and what already exists.
 */

import { aiChat } from '@/lib/ai';
import { generateCourse, type GeneratedCourse } from '@/lib/ai/course-generator';
import { logger } from '@/lib/logger';

// Credential Engine imports
import {
  buildGenerationContext,
  getCredential,
  searchCredentials,
  UNIVERSAL_CREDENTIAL_REGISTRY,
  type CredentialDefinition,
  type CourseBuild,
  type ModuleBuild,
} from './credential-engine';
import type { QuestionBuild } from './credential-engine/universal-platform';

// QA imports
import {
  generateReadinessReport,
  type CurriculumReadinessReport,
} from '@/lib/paris/qa-designer';

// Media imports  
import {
  analyzeMediaRequirements,
  generateLessonMedia,
  type MediaRequirements,
  type MediaAssets,
} from '@/lib/paris/media-designer';

// Instructional Design imports
import {
  validateInstructionalDesign,
  generateLearningObjectives,
} from '@/lib/paris/instructional-designer';

export interface IntegratedCourseBuildRequest {
  userRequest: string;
  credentialSlug?: string;
  options?: {
    includeVideo?: boolean;
    includeAudio?: boolean;
    includeSlides?: boolean;
    includeWorkbook?: boolean;
    includeInstructorGuide?: boolean;
    targetAudience?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface IntegratedCourseBuildResult {
  success: boolean;
  courseId?: string;
  credential: CredentialDefinition;
  build: CourseBuild;
  media: Record<string, MediaAssets>;
  readiness: CurriculumReadinessReport;
  qualityScore: number;
  errors?: string[];
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Convert the general AI draft into the credential platform's complete runtime
 * contract. Keeping this deterministic prevents the integrated endpoint from
 * reporting success with empty modules, exams, and media requirements.
 */
export function assembleIntegratedCourseBuild(
  course: GeneratedCourse,
  credential: CredentialDefinition,
  instructionalScore: number,
): CourseBuild {
  const sections = credential.examSections?.length
    ? credential.examSections
    : [{ name: 'Course Fundamentals', questions: 25, passingScore: credential.passingScore, topics: [] }];

  const modules: ModuleBuild[] = sections.map((section, sectionIndex) => {
    const assigned = course.lessons.filter((_, lessonIndex) => lessonIndex % sections.length === sectionIndex);
    const lessons = assigned.map((lesson, lessonIndex) => ({
      id: `lesson-${slug(lesson.title) || `${sectionIndex + 1}-${lessonIndex + 1}`}`,
      title: lesson.title,
      content: lesson.content,
      videoScript: lesson.video_segments.length
        ? lesson.video_segments.map((segment) =>
            `[${segment.title} · ${segment.duration_seconds}s]\n${segment.narration}\nVisual: ${segment.visual_direction}`,
          ).join('\n\n')
        : `${lesson.summary_text}\n\n${lesson.content}`.trim(),
      duration: lesson.duration_minutes,
      keyTerms: lesson.key_takeaways,
      learningObjectives: lesson.learning_objectives.length
        ? lesson.learning_objectives
        : lesson.competency_keys.length
        ? lesson.competency_keys.map((key) => `Apply ${key.replace(/-/g, ' ')} in a workplace scenario.`)
        : course.learning_objectives.slice(0, 3),
    }));

    const questions: QuestionBuild[] = assigned.flatMap((lesson, lessonIndex) =>
      lesson.quiz_questions.map((question, questionIndex) => ({
        id: `question-${sectionIndex + 1}-${lessonIndex + 1}-${questionIndex + 1}`,
        question: question.question,
        options: question.options,
        correctAnswer: question.correct_index,
        rationale: question.explanation,
        topic: lesson.competency_keys[0] ?? lesson.title,
        difficulty: question.difficulty,
      })),
    );

    return {
      id: `module-${sectionIndex + 1}-${slug(section.name)}`,
      title: section.name,
      examDomain: section.name,
      lessons,
      quiz: { questions, passingScore: section.passingScore ?? credential.passingScore, attempts: 3 },
      flashcards: assigned.flatMap((lesson, lessonIndex) =>
        lesson.key_takeaways.map((takeaway, takeawayIndex) => ({
          id: `flashcard-${sectionIndex + 1}-${lessonIndex + 1}-${takeawayIndex + 1}`,
          term: lesson.competency_keys[takeawayIndex] ?? lesson.title,
          definition: takeaway,
          topic: lesson.title,
        })),
      ),
    };
  }).filter((module) => module.lessons.length > 0);

  const allQuestions = modules.flatMap((module) => module.quiz.questions);
  const allLessons = modules.flatMap((module) => module.lessons);
  const hasContent = allLessons.length > 0 && allLessons.every((lesson) => lesson.content.trim().length >= 200);
  const hasAssessments = allQuestions.length > 0;

  return {
    credential,
    courseType: 'credential',
    modules,
    practiceExam: {
      title: `${credential.name} Practice Exam`,
      questions: allQuestions,
      sections: modules.map((module) => ({ name: module.examDomain, questionCount: module.quiz.questions.length })),
      passingScore: credential.passingScore,
      isAdaptive: true,
    },
    instructor: {
      name: 'Elevate Instructional Team',
      title: 'Credential Course Instructor',
      avatar: '/images/logo.png',
      voice: 'professional-encouraging',
      personality: 'Practical, supportive, and mastery-focused',
      bio: 'Course content is AI-assisted and reviewed by authorized subject-matter experts before publication.',
      expertise: sections.map((section) => section.name),
      teachingStyle: 'Segmented instruction, guided practice, knowledge checks, and targeted remediation',
      experience: 0,
    },
    media: {
      videos: allLessons.map((lesson) => ({
        id: `video-${lesson.id}`,
        lessonId: lesson.id,
        title: lesson.title,
        script: lesson.videoScript ?? lesson.content,
        duration: lesson.duration ?? 0,
        hasAnimation: true,
        hasDemo: /\b(apply|practice|demonstrate|procedure|scenario)\b/i.test(lesson.content),
        captions: lesson.videoScript ?? lesson.content,
      })),
      graphics: allLessons.map((lesson) => ({
        id: `graphic-${lesson.id}`,
        type: 'diagram' as const,
        title: `${lesson.title} visual guide`,
        description: `Accessible visual summary for ${lesson.title}`,
        lessonId: lesson.id,
      })),
      slides: modules.map((module) => ({
        id: `slides-${module.id}`,
        title: module.title,
        content: module.lessons.map((lesson) => lesson.title).join('\n'),
        moduleId: module.id,
      })),
    },
    labs: [],
    compliance: {
      stateCompliance: [],
      federalCompliance: [],
      accessibility: [{ standard: 'WCAG', level: '2.2 AA' }],
      wioaEligible: false,
      dolRegistered: false,
    },
    qualityScore: {
      overall: Math.round((instructionalScore + (hasContent ? 100 : 0) + (hasAssessments ? 100 : 0)) / 3),
      blueprintCoverage: 0,
      competencyAlignment: instructionalScore,
      examReadiness: hasAssessments ? 100 : 0,
      handsOnCoverage: 0,
      accessibility: 100,
      instructionalDesign: instructionalScore,
    },
    validation: {
      passed: instructionalScore >= 80 && hasContent && hasAssessments,
      scores: {
        overall: instructionalScore,
        blueprintCoverage: 0,
        competencyAlignment: instructionalScore,
        examReadiness: hasAssessments ? 100 : 0,
        handsOnCoverage: 0,
        accessibility: 100,
        instructionalDesign: instructionalScore,
      },
      issues: [],
      recommendations: [],
    },
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Main integration function - orchestrates everything
 */
export async function buildIntegratedCourse(
  request: IntegratedCourseBuildRequest
): Promise<IntegratedCourseBuildResult> {
  try {
    logger.info('Starting integrated course build', { request } as any);

    // 1. Build generation context from credential engine
    const context = buildGenerationContext({
      userRequest: request.userRequest,
      credentialSlug: request.credentialSlug,
    } as any);

    if (!context.credential) {
      throw new Error(`Could not identify credential from: ${request.userRequest}`);
    }

    logger.info('Credential identified', {
      slug: context.credential.slug,
      name: context.credential.name,
    } as any);

    // 2. Generate course using existing AI services
    const course = await generateCourse({
      prompt: request.userRequest,
      courseTitle: context.credential.name,
    } as any);

    // 3. Validate instructional design
    const lessons = course.lessons.map((l, i) => ({
      id: `lesson-${i}`,
      title: l.title,
      content: l.content,
      objectives: l.learning_objectives.length
        ? l.learning_objectives
        : l.competency_keys.length
        ? l.competency_keys.map((key) => `Apply ${key.replace(/-/g, ' ')} in a workplace scenario.`)
        : course.learning_objectives,
      competencies: l.competency_keys,
      competencyIds: l.competency_keys,
      quizQuestions: l.quiz_questions.map((question) => ({ question: question.question, options: question.options })),
    }));

    const competencyIds = context.credential.examSections?.flatMap(s => 
      s.topics || []
    ) || [];

    const idValidation = validateInstructionalDesign({
      lessons,
      competencies: competencyIds.map(id => ({ id: String(id), name: String(id) })) as any,
      prerequisites: {},
    } as any);

    logger.info('Instructional design validated', {
      score: idValidation.score,
      issues: idValidation.issues.length,
    } as any);

    // 4. Analyze and generate media for each lesson
    const media: Record<string, MediaAssets> = {};
    
    for (const lesson of course.lessons) {
      const requirements = analyzeMediaRequirements({
        lessonId: lesson.title,
        title: lesson.title,
        content: lesson.content,
        objectives: course.learning_objectives,
        competencyType: 'skill',
      } as any);

      if (request.options?.includeVideo || request.options?.includeAudio) {
        media[lesson.title] = await generateLessonMedia({
          lessonId: lesson.title,
          title: lesson.title,
          content: lesson.content,
          objectives: course.learning_objectives,
          competencyType: 'skill',
        } as any);
      }
    }

    // 5. Build the complete credential-platform contract.
    const build = assembleIntegratedCourseBuild(course, context.credential, idValidation.score);

    // 6. Generate readiness report
    const readiness = generateReadinessReport({
      courseId: context.credential.slug,
      courseName: context.credential.name,
      lessons,
      modules: build.modules.map((module) => ({
        id: module.id,
        title: module.title,
        lessonIds: module.lessons.map((lesson) => lesson.id),
      })),
      competencies: competencyIds.map(id => ({ id: String(id), name: String(id) })),
      blueprintTopics: context.credential.examSections?.flatMap(s => 
        s.topics.map(t => ({ id: t, title: t, section: s.name })) || []
      ) || [],
      mediaAssets: build.media.videos.map((video) => ({
        id: video.id,
        lessonId: video.lessonId,
        type: 'video' as const,
        status: media[video.title] ? 'complete' as const : 'pending' as const,
      })),
    } as any);

    build.qualityScore.overall = readiness.overallScore;
    build.validation.passed = build.validation.passed && readiness.isReady;

    logger.info('Course build complete', {
      readiness: readiness.isReady,
      score: readiness.overallScore,
    } as any);

    return {
      success: true,
      courseId: context.credential.slug,
      credential: context.credential,
      build,
      media,
      readiness,
      qualityScore: readiness.overallScore,
    };
  } catch (error) {
    logger.error('Course build failed', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      credential: {} as CredentialDefinition,
      build: {} as any,
      media: {},
      readiness: {} as any,
      qualityScore: 0,
      errors: [String(error)],
    };
  }
}

/**
 * Search for credentials
 */
export function searchAvailableCredentials(query: string): CredentialDefinition[] {
  return searchCredentials(query);
}

/**
 * Get credential by slug
 */
export function getCredentialBySlug(slug: string): CredentialDefinition | undefined {
  return getCredential(slug);
}

/**
 * List all available credentials
 */
export function listAllCredentials(): CredentialDefinition[] {
  return Object.values(UNIVERSAL_CREDENTIAL_REGISTRY);
}

/**
 * Generate learning objectives for a lesson
 */
export function generateLessonObjectives(params: {
  lessonTitle: string;
  topic: string;
  competencyIds: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}) {
  return generateLearningObjectives(params);
}
