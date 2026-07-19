/**
 * Course Builder Integration Layer
 * 
 * Wires the Credential Intelligence Engine to existing AI services.
 * This is the bridge between what we built and what already exists.
 */

import { aiChat } from '@/lib/ai';
import { generateCourse } from '@/lib/ai/course-generator';
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
      objectives: course.learning_objectives,
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

    // 5. Build course structure for database
    const build: CourseBuild = {
      credential: context.credential,
      courseType: 'exam_prep',
      modules: [],
      practiceExam: {
        title: course.title,
        questions: [],
        sections: [],
        passingScore: context.credential.passingScore,
        isAdaptive: false,
      },
      instructor: {
        name: 'AI Generated',
        title: 'Course Instructor',
        bio: 'AI-generated course content',
        credentials: [],
        avatar: undefined,
      },
      media: {
        videos: [],
        graphics: [],
        slides: [],
      },
      labs: [],
      compliance: {
        stateCompliance: [],
        federalCompliance: [],
        accessibility: [],
        wioaEligible: false,
        dolRegistered: false,
      },
      qualityScore: {
        overall: idValidation.score,
        instructional: idValidation.score,
        media: 0,
        compliance: 0,
      },
      validation: {
        valid: true,
        errors: [],
        warnings: idValidation.issues,
      },
      version: '1.0.0',
      createdAt: new Date().toISOString(),
    } as unknown as CourseBuild;

    // 6. Generate readiness report
    const readiness = generateReadinessReport({
      courseId: context.credential.slug,
      courseName: context.credential.name,
      lessons,
      modules: [],
      competencies: competencyIds.map(id => ({ id: String(id), name: String(id) })),
      blueprintTopics: context.credential.examSections?.flatMap(s => 
        s.topics.map(t => ({ id: t, title: t, section: s.name })) || []
      ) || [],
      
    } as any);

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
