/**
 * Canonical Course Factory.
 *
 * This is the single course-creation orchestration boundary. Authoring surfaces,
 * automatic program provisioning, and scripts call this module instead of
 * assembling courses with independent generation/publish pipelines.
 *
 * Flow:
 * 1. Resolve program + registered blueprint, or generate a free-form blueprint
 * 2. Enrich every learner-facing lesson
 * 3. Generate checkpoint/final assessment banks
 * 4. Validate the complete course package
 * 5. Persist courses -> modules -> lessons through the canonical publisher
 * 6. Queue missing media when requested
 */

import { isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import { queueCourseLessonVideos } from '@/lib/course-builder/video-queue';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
import { loadBlueprintWithProgram } from './blueprint-loader';
import {
  generateAssessment,
  generateBlueprintFromAI,
  generateFinalExam,
  generateLessonContent,
} from './content-generator';
import { publishCourse } from './publisher';
import { inferStepType, validateBlueprint } from './validator';
import type {
  FactoryInput,
  FactoryOutput,
  FactoryStage,
  ProgressCallback,
} from './types';

class ProgressTracker {
  private callbacks: ProgressCallback[] = [];

  addCallback(cb: ProgressCallback) {
    this.callbacks.push(cb);
  }

  emit(stage: FactoryStage, message: string, progress?: number) {
    for (const cb of this.callbacks) cb(stage, message, progress);
    logger.info(`[course-factory] ${stage}: ${message}`);
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}

function cloneBlueprint(blueprint: CredentialBlueprint): CredentialBlueprint {
  return {
    ...blueprint,
    modules: blueprint.modules.map((courseModule) => ({
      ...courseModule,
      lessons: (courseModule.lessons ?? []).map((lesson) => ({ ...lesson })),
    })),
  };
}

function normalizeGeneratedSlug(slug: string, stepType: string, fallback: string): string {
  const base = slugify(slug || fallback);
  if (stepType === 'checkpoint' && !base.includes('checkpoint')) return `${base}-checkpoint`;
  if (stepType === 'quiz' && !base.includes('quiz')) return `${base}-quiz`;
  if (stepType === 'exam' && !base.includes('exam') && !base.includes('final')) return `${base}-exam`;
  if (stepType === 'lab' && !base.includes('lab')) return `${base}-lab`;
  if (stepType === 'assignment' && !base.includes('assignment')) return `${base}-assignment`;
  return base;
}

async function generateFreeFormBlueprint(
  input: FactoryInput,
  programSlug: string,
): Promise<CredentialBlueprint> {
  if (!input.title || !input.topic) {
    throw new Error('title and topic are required when no registered blueprint exists');
  }

  const raw = await generateBlueprintFromAI({
    title: input.title,
    topic: input.topic,
    audience: input.audience ?? `${input.difficulty ?? 'intermediate'} workforce learner`,
    state: input.state,
    credential: input.credential,
    moduleCount: input.moduleCount,
    lessonsPerModule: input.lessonsPerModule,
  });

  const modules = (raw.modules ?? []).map((courseModule, moduleIndex) => {
    const lessons = (courseModule.lessons ?? []).map((lesson, lessonIndex) => {
      const stepType = lesson.stepType || 'lesson';
      return {
        slug: normalizeGeneratedSlug(
          lesson.slug,
          stepType,
          `${courseModule.title}-${lesson.title || lessonIndex + 1}`,
        ),
        title: lesson.title || `Lesson ${lessonIndex + 1}`,
        order: lessonIndex + 1,
        domainKey: slugify(courseModule.title),
      };
    });

    const typeCounts = lessons.reduce<Record<string, number>>((counts, lesson) => {
      const type = inferStepType(lesson.slug);
      counts[type] = (counts[type] ?? 0) + 1;
      return counts;
    }, {});

    return {
      slug: slugify(courseModule.title || `module-${moduleIndex + 1}`),
      title: courseModule.title || `Module ${moduleIndex + 1}`,
      description: courseModule.description,
      orderIndex: moduleIndex + 1,
      minLessons: lessons.length,
      maxLessons: lessons.length,
      quizRequired: Boolean(typeCounts.checkpoint || typeCounts.quiz),
      practicalRequired: Boolean(typeCounts.lab || typeCounts.assignment),
      isCritical: true,
      requiredLessonTypes: Object.entries(typeCounts).map(([lessonType, requiredCount]) => ({
        lessonType,
        requiredCount,
      })),
      competencies: [],
      domainKey: slugify(courseModule.title),
      lessons,
    };
  });

  const expectedLessonCount = modules.reduce(
    (count, courseModule) => count + courseModule.lessons.length,
    0,
  );
  const credentialTitle = input.credential || raw.title || input.title;
  const credentialCode = slugify(input.credential || input.title).toUpperCase().slice(0, 24);

  return {
    id: `generated-${programSlug}-${Date.now().toString(36)}`,
    programSlug,
    credentialSlug: slugify(credentialTitle),
    credentialTitle,
    credentialCode,
    state: input.state ?? 'federal',
    status: 'draft',
    version: '1.0.0',
    title: raw.title || input.title,
    description: raw.description,
    expectedModuleCount: modules.length,
    expectedLessonCount,
    modules,
    assessmentRules: [
      {
        assessmentType: 'module',
        scope: 'all',
        minQuestions: 8,
        maxQuestions: 10,
        passingThreshold: 0.7,
      },
      {
        assessmentType: 'final',
        scope: 'all',
        minQuestions: 25,
        maxQuestions: 40,
        passingThreshold: 0.75,
      },
    ],
    generationRules: {
      allowRemediation: true,
      allowExpansionLessons: true,
      maxTotalLessons: expectedLessonCount,
      requiresFinalExam: true,
      generatorMode: 'flexible',
    },
  };
}

async function enrichBlueprint(
  blueprint: CredentialBlueprint,
  progress: ProgressTracker,
): Promise<{
  blueprint: CredentialBlueprint;
  assessmentsGenerated: number;
  failures: Array<{ slug: string; reason: string }>;
}> {
  const enriched = cloneBlueprint(blueprint);
  const failures: Array<{ slug: string; reason: string }> = [];
  let assessmentsGenerated = 0;
  const totalLessons = enriched.modules.reduce(
    (count, courseModule) => count + (courseModule.lessons?.length ?? 0),
    0,
  );
  let processed = 0;

  for (const courseModule of enriched.modules) {
    for (const lesson of courseModule.lessons ?? []) {
      const stepType = inferStepType(lesson.slug);
      progress.emit(
        'enrich',
        `Building ${lesson.title}`,
        totalLessons > 0 ? Math.round((processed / totalLessons) * 100) : 0,
      );

      try {
        const generated = await generateLessonContent({
          lesson,
          moduleTitle: courseModule.title,
          courseTitle: blueprint.credentialTitle,
          state: blueprint.state ?? undefined,
        });

        lesson.objective = generated.objective;
        lesson.content = generated.content;
        lesson.quizQuestions = generated.quiz_questions.map((question, index) => ({
          id: `${lesson.slug}-q${index + 1}`,
          question: question.question,
          options: question.options,
          correctAnswer: question.correct,
          explanation: question.explanation,
        }));

        if (stepType === 'checkpoint' || stepType === 'quiz') {
          progress.emit('assess', `Generating checkpoint bank: ${lesson.title}`);
          const rule = blueprint.assessmentRules?.find(
            (entry) => entry.assessmentType === 'module',
          );
          const questionCount = Math.max(5, rule?.minQuestions ?? 8);
          const assessment = await generateAssessment({
            lessonSlug: lesson.slug,
            lessonTitle: lesson.title,
            moduleTitle: courseModule.title,
            courseTitle: blueprint.credentialTitle,
            questionCount,
            questionTypes: ['multiple_choice', 'scenario'],
          });
          lesson.quizQuestions = assessment.questions.map((question, index) => ({
            id: `${lesson.slug}-q${index + 1}`,
            question: question.question,
            options: question.options,
            correctAnswer: question.correct,
            explanation: question.explanation,
          }));
          lesson.passingScore = Math.round((rule?.passingThreshold ?? 0.7) * 100);
          assessmentsGenerated += 1;
        } else if (stepType === 'exam') {
          progress.emit('assess', `Generating final exam bank: ${lesson.title}`);
          const rule = blueprint.assessmentRules?.find(
            (entry) => entry.assessmentType === 'final',
          );
          const questionCount = Math.max(25, rule?.minQuestions ?? 25);
          const assessment = await generateFinalExam(
            blueprint.credentialTitle,
            blueprint.modules.length,
            questionCount,
          );
          lesson.quizQuestions = assessment.questions.map((question, index) => ({
            id: `${lesson.slug}-q${index + 1}`,
            question: question.question,
            options: question.options,
            correctAnswer: question.correct,
            explanation: question.explanation,
          }));
          lesson.passingScore = Math.round((rule?.passingThreshold ?? 0.75) * 100);
          assessmentsGenerated += 1;
        }
      } catch (error) {
        failures.push({
          slug: lesson.slug,
          reason: error instanceof Error ? error.message : String(error),
        });
      }

      processed += 1;
    }
  }

  return { blueprint: enriched, assessmentsGenerated, failures };
}

export async function courseFactory(
  input: FactoryInput,
  onProgress?: ProgressCallback,
): Promise<FactoryOutput> {
  const progress = new ProgressTracker();
  if (onProgress) progress.addCallback(onProgress);

  try {
    progress.emit('init', 'Initializing canonical Course Factory.');
    progress.emit('resolve', 'Resolving program and curriculum source.');

    const db = await requireAdminClient();
    let programQuery = db.from('programs').select('id, slug, title');
    if (input.programId) programQuery = programQuery.eq('id', input.programId);
    else if (input.programSlug) programQuery = programQuery.eq('slug', input.programSlug);
    else {
      return {
        ok: false,
        status: 'not_found',
        errors: ['programId or programSlug is required'],
        warnings: [],
      };
    }

    const { data: program, error: programError } = await programQuery.maybeSingle();
    if (programError) throw programError;
    if (!program?.id) {
      return {
        ok: false,
        status: 'not_found',
        errors: ['Canonical program record not found'],
        warnings: [],
      };
    }

    const resolved = input.blueprint
      ? null
      : await loadBlueprintWithProgram(db, {
          programId: program.id,
          programSlug: program.slug ?? input.programSlug,
        });

    let blueprint: CredentialBlueprint;
    if (input.blueprint) {
      blueprint = input.blueprint;
    } else if (resolved?.blueprint) {
      blueprint = resolved.blueprint;
    } else if (input.title && input.topic && input.contentSource !== 'blueprint') {
      if (!isAIAvailable()) {
        return {
          ok: false,
          status: 'no_blueprint',
          errors: ['No registered blueprint exists and AI blueprint generation is unavailable'],
          warnings: [],
        };
      }
      progress.emit('blueprint', 'No registered blueprint found; generating one in Course Factory.');
      blueprint = await generateFreeFormBlueprint(
        input,
        program.slug || input.programSlug || slugify(program.title || input.title),
      );
    } else {
      return {
        ok: false,
        status: 'no_blueprint',
        errors: ['No registered blueprint matches this program'],
        warnings: [],
      };
    }

    progress.emit('blueprint', `Blueprint ready: ${blueprint.credentialTitle}`);

    const expectedLessonCount =
      blueprint.expectedLessonCount ??
      blueprint.modules.reduce(
        (count, courseModule) => count + (courseModule.lessons?.length ?? 0),
        0,
      );

    let completeBlueprint = cloneBlueprint(blueprint);
    let assessmentsGenerated = 0;
    let generationFailures: Array<{ slug: string; reason: string }> = [];

    if (input.contentSource === 'ai') {
      if (!isAIAvailable()) {
        return {
          ok: false,
          status: 'incomplete',
          expectedLessonCount,
          generationFailures: [{ slug: 'course', reason: 'AI service is not available' }],
          errors: ['AI content generation was requested but the AI service is not available'],
          warnings: [],
        };
      }

      const generated = await enrichBlueprint(blueprint, progress);
      completeBlueprint = generated.blueprint;
      assessmentsGenerated = generated.assessmentsGenerated;
      generationFailures = generated.failures;

      if (generationFailures.length > 0) {
        progress.emit(
          'error',
          `Course generation stopped: ${generationFailures.length} lesson(s) failed generation.`,
        );
        return {
          ok: false,
          status: 'incomplete',
          title: blueprint.credentialTitle,
          moduleCount: blueprint.modules.length,
          expectedLessonCount,
          assessmentsGenerated,
          generationFailures,
          errors: ['The factory will not persist a partially generated course'],
          warnings: [],
        };
      }
    }

    progress.emit('validate', 'Validating the complete course package.');
    const validation = validateBlueprint(completeBlueprint);
    if (!validation.valid) {
      return {
        ok: false,
        status: 'validation_failed',
        title: completeBlueprint.credentialTitle,
        moduleCount: completeBlueprint.modules.length,
        expectedLessonCount,
        assessmentsGenerated,
        errors: validation.errors.map(
          (issue) => `${issue.module ?? 'course'}${issue.lesson ? `/${issue.lesson}` : ''}: ${issue.message}`,
        ),
        warnings: validation.warnings.map((issue) => issue.message),
        dryRun: Boolean(input.dryRun),
      };
    }

    const validatedLessonCount = completeBlueprint.modules.reduce(
      (count, courseModule) => count + (courseModule.lessons?.length ?? 0),
      0,
    );

    if (input.dryRun) {
      const completionRatio =
        expectedLessonCount > 0 ? validatedLessonCount / expectedLessonCount : 1;
      progress.emit('complete', 'Course package generated and validated in dry-run mode.', 100);
      return {
        ok: completionRatio >= 1,
        status: completionRatio >= 1 ? 'success' : 'incomplete',
        courseSlug: completeBlueprint.programSlug ?? undefined,
        title: completeBlueprint.credentialTitle,
        moduleCount: completeBlueprint.modules.length,
        lessonCount: validatedLessonCount,
        expectedLessonCount,
        completionRatio,
        assessmentsGenerated,
        videosQueued: 0,
        generationFailures,
        warnings: validation.warnings.map((issue) => issue.message),
        errors: completionRatio >= 1 ? [] : ['Generated lesson count does not satisfy the blueprint contract'],
        dryRun: true,
      };
    }

    progress.emit('publish', 'Persisting the canonical LMS course package.');
    const publishResult = await publishCourse({
      programId: program.id,
      courseSlug: completeBlueprint.programSlug ?? `course-${Date.now()}`,
      courseTitle: completeBlueprint.credentialTitle,
      blueprint: completeBlueprint.modules,
      mode: input.mode ?? 'missing-only',
      contentSource: input.contentSource === 'curriculum_lessons' ? 'curriculum_lessons' : 'blueprint',
      videoConfig: { enabled: input.videoMode === 'queue' },
    });

    const retainedLessons = publishResult.lessonCount + publishResult.skippedCount;
    const completionRatio =
      expectedLessonCount > 0 ? retainedLessons / expectedLessonCount : 1;

    if (!publishResult.success || completionRatio < 1) {
      if (publishResult.courseId) {
        await db
          .from('courses')
          .update({ status: 'draft', is_active: false, updated_at: new Date().toISOString() })
          .eq('id', publishResult.courseId);
      }

      return {
        ok: false,
        status: 'incomplete',
        courseId: publishResult.courseId,
        courseSlug: completeBlueprint.programSlug ?? undefined,
        title: completeBlueprint.credentialTitle,
        moduleCount: publishResult.moduleCount,
        lessonCount: publishResult.lessonCount,
        skippedCount: publishResult.skippedCount,
        expectedLessonCount,
        completionRatio,
        assessmentsGenerated,
        generationFailures,
        errors: publishResult.errors.length
          ? publishResult.errors
          : ['Persisted lesson count does not satisfy the blueprint contract'],
        warnings: publishResult.warnings,
        dryRun: false,
      };
    }

    let videosQueued = 0;
    if (input.videoMode === 'queue' && publishResult.courseId) {
      progress.emit('media', 'Queuing missing lesson media from the canonical course.');
      const media = await queueCourseLessonVideos({
        courseId: publishResult.courseId,
        onlyMissing: true,
        limit: typeof input.videoQueueLimit === 'number' ? input.videoQueueLimit : null,
      });
      videosQueued = media.queued ?? 0;
    }

    progress.emit('complete', 'Canonical course build complete.', 100);
    return {
      ok: true,
      status: 'success',
      courseId: publishResult.courseId,
      courseSlug: completeBlueprint.programSlug ?? undefined,
      title: completeBlueprint.credentialTitle,
      moduleCount: publishResult.moduleCount,
      lessonCount: publishResult.lessonCount,
      skippedCount: publishResult.skippedCount,
      expectedLessonCount,
      completionRatio,
      assessmentsGenerated,
      videosQueued,
      generationFailures,
      warnings: publishResult.warnings,
      errors: [],
      dryRun: false,
    };
  } catch (error) {
    logger.error('[course-factory] Course factory failed', error);
    progress.emit(
      'error',
      `Factory failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      ok: false,
      status: 'db_error',
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: [],
      dryRun: Boolean(input.dryRun),
    };
  }
}

export interface SimpleCourseInput {
  programSlug: string;
  mode?: 'replace' | 'missing-only';
  contentSource?: 'ai' | 'blueprint';
  includeVideos?: boolean;
}

/**
 * Default creation behavior is a complete AI-authored package. Callers that
 * explicitly want a blueprint-only skeleton must opt into contentSource=blueprint.
 */
export async function createCourse(input: SimpleCourseInput): Promise<FactoryOutput> {
  return courseFactory({
    programSlug: input.programSlug,
    mode: input.mode ?? 'missing-only',
    contentSource: input.contentSource ?? 'ai',
    videoMode: input.includeVideos === false ? 'off' : 'queue',
  });
}

export async function factoryFromSlug(
  slug: string,
  options?: {
    mode?: 'replace' | 'missing-only';
    contentSource?: 'ai' | 'blueprint';
    includeVideos?: boolean;
  },
): Promise<FactoryOutput> {
  return createCourse({
    programSlug: slug,
    mode: options?.mode ?? 'missing-only',
    contentSource: options?.contentSource ?? 'ai',
    includeVideos: options?.includeVideos ?? true,
  });
}
