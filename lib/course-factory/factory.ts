/**
 * Canonical Course Factory.
 *
 * This is the single course-creation orchestration boundary. Authoring surfaces,
 * automatic program provisioning, and scripts should call this module instead of
 * assembling courses with independent generation/publish pipelines.
 *
 * Flow:
 * 1. Resolve program + blueprint
 * 2. Enrich every instructional lesson when AI generation is requested
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

function cloneBlueprint(blueprint: CredentialBlueprint): CredentialBlueprint {
  return {
    ...blueprint,
    modules: blueprint.modules.map((module) => ({
      ...module,
      lessons: (module.lessons ?? []).map((lesson) => ({ ...lesson })),
    })),
  };
}

async function resolveProgramId(input: FactoryInput): Promise<string | null> {
  if (input.programId) return input.programId;
  if (!input.programSlug) return null;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('programs')
    .select('id')
    .eq('slug', input.programSlug)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
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
    (count, module) => count + (module.lessons?.length ?? 0),
    0,
  );
  let processed = 0;

  for (const module of enriched.modules) {
    for (const lesson of module.lessons ?? []) {
      const stepType = inferStepType(lesson.slug);
      progress.emit(
        'enrich',
        `Building ${lesson.title}`,
        totalLessons > 0 ? Math.round((processed / totalLessons) * 100) : 0,
      );

      try {
        // Every learner-facing row gets a real objective/content package. Assessment
        // rows additionally receive a purpose-built question bank below.
        const generated = await generateLessonContent({
          lesson,
          moduleTitle: module.title,
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
            moduleTitle: module.title,
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
    progress.emit('resolve', 'Resolving program and registered blueprint.');

    const db = await requireAdminClient();
    const programId = await resolveProgramId(input);

    const resolved = input.blueprint
      ? null
      : await loadBlueprintWithProgram(db, {
          programId: input.programId,
          programSlug: input.programSlug,
        });

    if (!resolved && !input.blueprint) {
      return {
        ok: false,
        status: 'no_blueprint',
        errors: ['Program not found or no matching registered blueprint'],
        warnings: [],
      };
    }

    const blueprint = input.blueprint ?? resolved!.blueprint;
    const canonicalProgramId = programId ?? resolved?.program.id ?? null;

    if (!canonicalProgramId) {
      return {
        ok: false,
        status: 'not_found',
        errors: ['A canonical program record is required before a course can be built'],
        warnings: [],
      };
    }

    progress.emit('blueprint', `Loaded blueprint: ${blueprint.credentialTitle}`);

    const expectedLessonCount =
      blueprint.expectedLessonCount ??
      blueprint.modules.reduce((count, module) => count + (module.lessons?.length ?? 0), 0);

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
      };
    }

    progress.emit('publish', 'Persisting the canonical LMS course package.');
    const publishResult = await publishCourse({
      programId: canonicalProgramId,
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
