/**
 * Course Builder Integration Layer
 * 
 * Wires the Credential Intelligence Engine to existing AI services.
 * This is the bridge between what we built and what already exists.
 */

import { aiChat } from '@/lib/ai';
import { generateCourse } from '@/lib/ai/course-generator';
import { generateImage } from '@/lib/ai/image-generator';
import { detectCourseGaps } from '@/lib/ai/course-gap-detection';
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

/**
 * Main integration function - orchestrates everything
 */
export async function buildIntegratedCourse(
  request: IntegratedCourseBuildRequest
): Promise<IntegratedCourseBuildResult> {
  try {
    logger.info('Starting integrated course build', { request });

    // 1. Build generation context from credential engine
    const context = buildGenerationContext({
      userRequest: request.userRequest,
      credentialSlug: request.credentialSlug,
    });

    if (!context.credential) {
      throw new Error(`Could not identify credential from: ${request.userRequest}`);
    }

    logger.info('Credential identified', {
      slug: context.credential.slug,
      name: context.credential.name,
    });

    // 2. Generate course using existing AI services
    const course = await generateCourse({
      prompt: request.userRequest,
      courseTitle: context.credential.name,
    });

    // 3. Validate instructional design
    const lessons = course.lessons.map((l, i) => ({
      id: `lesson-${i}`,
      title: l.title,
      content: l.content,
      objectives: l.learning_objectives,
    }));

    const competencyIds = context.credential.examSections?.flatMap(s => 
      s.topics?.map(t => t.id) || []
    ) || [];

    const idValidation = validateInstructionalDesign({
      lessons,
      competencies: competencyIds.map(id => ({ id, name: id })),
      prerequisites: {},
    });

    logger.info('Instructional design validated', {
      score: idValidation.score,
      issues: idValidation.issues.length,
    });

    // 4. Analyze and generate media for each lesson
    const media: Record<string, MediaAssets> = {};
    
    for (const lesson of course.lessons) {
      const requirements = analyzeMediaRequirements({
        lessonId: lesson.title,
        title: lesson.title,
        content: lesson.content,
        objectives: lesson.learning_objectives,
        competencyType: 'skill',
      });

      if (request.options?.includeVideo || request.options?.includeAudio) {
        media[lesson.title] = await generateLessonMedia({
          lessonId: lesson.title,
          title: lesson.title,
          content: lesson.content,
          objectives: lesson.learning_objectives,
          competencyType: 'skill',
        });
      }
    }

    // 5. Build course structure for database
    const build: CourseBuild = {
      id: `build-${Date.now()}`,
      credentialSlug: context.credential.slug,
      credentialName: context.credential.name,
      status: 'generating',
      progress: {
        modules: course.lessons.length,
        lessons: course.lessons.length,
        quizzes: course.lessons.reduce((acc, l) => acc + (l.quiz_questions?.length || 0), 0),
        videos: Object.keys(media).length,
        quality: idValidation.score,
      },
      modules: [],
      instructor: undefined,
      media: Object.values(media).flatMap(m => [
        ...(m.videos || []),
        ...(m.diagrams || []),
        ...(m.slides || []),
      ]),
      compliance: {
        wioaEligible: context.credential.wioaEligible || false,
        dolRegistered: context.credential.dolRegistered || false,
        stateApproved: context.credential.states || [],
      },
      createdAt: new Date().toISOString(),
    };

    // 6. Generate readiness report
    const readiness = generateReadinessReport({
      courseId: build.id,
      courseName: context.credential.name,
      lessons,
      modules: [],
      competencies: competencyIds.map(id => ({ id, name: id })),
      blueprintTopics: context.credential.examSections?.flatMap(s => 
        s.topics?.map(t => ({ id: t.id, title: t.id, section: s.name })) || []
      ) || [],
      mediaAssets: Object.values(media).flatMap(m => [
        ...(m.videos || []).map(v => ({ id: v.lessonId, lessonId: v.lessonId, type: 'video' as const, status: v.status })),
        ...(m.diagrams || []).map(d => ({ id: d.lessonId, lessonId: d.lessonId, type: 'slides' as const, status: d.status })),
      ]),
    });

    logger.info('Course build complete', {
      readiness: readiness.isReady,
      score: readiness.overallScore,
    });

    return {
      success: true,
      courseId: build.id,
      credential: context.credential,
      build,
      media,
      readiness,
      qualityScore: readiness.overallScore,
    };
  } catch (error) {
    logger.error('Course build failed', { error });
    return {
      success: false,
      credential: {} as CredentialDefinition,
      build: {} as CourseBuild,
      media: {},
      readiness: {} as CurriculumReadinessReport,
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
