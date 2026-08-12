/**
 * Canonical Course Factory for blueprint-backed course creation.
 *
 * Flow:
 * 1. Resolve program + blueprint
 * 2. Enrich missing content/assessments when requested
 * 3. Validate the complete blueprint
 * 4. Persist one canonical courses → course_modules → course_lessons tree
 * 5. Queue missing videos when requested
 */
import { requireAdminClient } from '@/lib/supabase/admin';
import { isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import {
  loadBlueprintWithProgram,
  resolveProgram,
} from './blueprint-loader';
import { publishCourse } from './publisher';
import { generateAssessment, generateLessonContent } from './content-generator';
import { validateBlueprint } from './validator';
import { queueCourseLessonVideos } from '@/lib/course-builder/video-queue';
import type {
  CredentialBlueprint,
  BlueprintLessonRef,
  BlueprintModule,
  FactoryInput,
  FactoryOutput,
  FactoryStage,
  ProgressCallback,
} from './types';

class ProgressTracker {
  private callbacks: ProgressCallback[] = [];

  addCallback(callback: ProgressCallback) {
    this.callbacks.push(callback);
  }

  emit(stage: FactoryStage, message: string, progress?: number) {
    for (const callback of this.callbacks) callback(stage, message, progress);
    logger.info(`[course-factory] ${stage}: ${message}`);
  }
}

function cloneBlueprint(blueprint: CredentialBlueprint): CredentialBlueprint {
  return structuredClone(blueprint);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!items.length) return [];
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function runWorker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => runWorker()),
  );
  return results;
}

function inferLessonType(lesson: BlueprintLessonRef): string {
  const explicit = String((lesson as any).stepType ?? (lesson as any).type ?? '').toLowerCase();
  if (explicit) return explicit;
  const slug = lesson.slug.toLowerCase();
  if (slug.includes('exam') || slug.includes('final')) return 'exam';
  if (slug.includes('checkpoint') || slug.includes('quiz')) return 'checkpoint';
  if (slug.includes('lab')) return 'lab';
  if (slug.includes('assignment')) return 'assignment';
  return 'lesson';
}

async function enrichBlueprintWithAI(
  blueprint: CredentialBlueprint,
  progress: ProgressTracker,
): Promise<CredentialBlueprint> {
  if (!isAIAvailable()) {
    progress.emit('enrich', 'AI provider unavailable; validating blueprint content as-is.');
    return blueprint;
  }

  const modules = await mapWithConcurrency(blueprint.modules, 2, async (module, moduleIndex) => {
    progress.emit(
      'enrich',
      `Enriching module ${moduleIndex + 1}/${blueprint.modules.length}: ${module.title}`,
      Math.round((moduleIndex / Math.max(1, blueprint.modules.length)) * 70),
    );

    const lessons = await mapWithConcurrency(module.lessons ?? [], 3, async (lesson) => {
      const lessonType = inferLessonType(lesson);
      let next: BlueprintLessonRef = { ...lesson };

      const needsInstructionalContent =
        lessonType !== 'exam' && (!lesson.content?.trim() || !lesson.objective?.trim());
      if (needsInstructionalContent) {
        try {
          const generated = await generateLessonContent({
            lesson,
            moduleTitle: module.title,
            courseTitle: blueprint.credentialTitle,
            state: blueprint.state,
            standardsBlock: blueprint.sourceReference,
          });
          next = {
            ...next,
            objective: generated.objective || next.objective,
            learningObjectives:
              next.learningObjectives?.length
                ? next.learningObjectives
                : generated.objective
                  ? [generated.objective]
                  : next.learningObjectives,
            content: generated.content || next.content,
            quizQuestions:
              next.quizQuestions?.length
                ? next.quizQuestions
                : generated.quiz_questions.map((question, index) => ({
                    id: `${lesson.slug}-q${index + 1}`,
                    question: question.question,
                    options: question.options,
                    correctAnswer: question.correct,
                    explanation: question.explanation,
                  })),
          };
        } catch (error) {
          logger.warn('[course-factory] Lesson AI enrichment failed', {
            lesson: lesson.slug,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const needsAssessment =
        ['checkpoint', 'quiz', 'exam'].includes(lessonType) && !next.quizQuestions?.length;
      if (needsAssessment) {
        try {
          const assessment = await generateAssessment({
            lessonSlug: next.slug,
            lessonTitle: next.title,
            moduleTitle: module.title,
            courseTitle: blueprint.credentialTitle,
            questionCount: lessonType === 'exam' ? blueprint.finalExam?.questionCount ?? 25 : 10,
            questionTypes: ['multiple_choice', 'scenario'],
          });
          next = {
            ...next,
            quizQuestions: assessment.questions.map((question, index) => ({
              id: `${next.slug}-q${index + 1}`,
              question: question.question,
              options: question.options,
              correctAnswer: question.correct,
              explanation: question.explanation,
            })),
            passingScore:
              next.passingScore ??
              (lessonType === 'exam' ? blueprint.finalExam?.passingScore ?? 75 : 70),
          };
        } catch (error) {
          logger.warn('[course-factory] Assessment AI enrichment failed', {
            lesson: next.slug,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return next;
    });

    return { ...module, lessons } as BlueprintModule;
  });

  progress.emit('enrich', 'AI enrichment complete.', 75);
  return { ...blueprint, modules };
}

export async function courseFactory(
  input: FactoryInput,
  onProgress?: ProgressCallback,
): Promise<FactoryOutput> {
  const progress = new ProgressTracker();
  if (onProgress) progress.addCallback(onProgress);

  try {
    progress.emit('init', 'Initializing Course Factory…', 2);
    const db = await requireAdminClient();

    progress.emit('resolve', 'Resolving program and blueprint…', 5);
    let program;
    let blueprint: CredentialBlueprint;

    if (input.blueprint) {
      program = await resolveProgram(db, { id: input.programId, slug: input.programSlug });
      if (!program) {
        return {
          ok: false,
          status: 'not_found',
          errors: ['Program not found for the supplied blueprint'],
          warnings: [],
        };
      }
      blueprint = cloneBlueprint(input.blueprint);
    } else {
      const resolved = await loadBlueprintWithProgram(db, {
        programId: input.programId,
        programSlug: input.programSlug,
      });
      if (!resolved) {
        return {
          ok: false,
          status: 'not_found',
          errors: ['Program not found or no matching blueprint'],
          warnings: [],
        };
      }
      program = resolved.program;
      blueprint = cloneBlueprint(resolved.blueprint);
    }

    progress.emit('blueprint', `Loaded blueprint: ${blueprint.credentialTitle}`, 10);

    if (input.contentSource === 'ai') {
      blueprint = await enrichBlueprintWithAI(blueprint, progress);
    }

    progress.emit('validate', 'Validating blueprint structure and content…', 80);
    const validation = validateBlueprint(blueprint);
    if (!validation.ok) {
      return {
        ok: false,
        status: 'incomplete',
        errors: validation.errors.map((issue) =>
          [issue.module, issue.lesson, issue.field, issue.message].filter(Boolean).join(' / '),
        ),
        warnings: validation.warnings.map((issue) => issue.message),
      };
    }

    progress.emit('publish', 'Persisting canonical course draft…', 85);
    const publishResult = await publishCourse({
      programId: program.id,
      courseSlug: blueprint.programSlug || `course-${Date.now().toString(36)}`,
      courseTitle: blueprint.credentialTitle,
      blueprint: blueprint.modules,
      mode: input.mode ?? 'missing-only',
    });

    if (!publishResult.success) {
      return {
        ok: false,
        status: 'incomplete',
        errors: publishResult.errors,
        warnings: [...validation.warnings.map((issue) => issue.message), ...publishResult.warnings],
      };
    }

    let videoWarnings: string[] = [];
    if (input.videoMode === 'queue' && publishResult.courseId) {
      progress.emit('publish', 'Queueing missing lesson videos…', 95);
      try {
        const videoResult = await queueCourseLessonVideos({
          courseId: publishResult.courseId,
          onlyMissing: true,
          limit: input.videoQueueLimit ?? undefined,
        });
        if (videoResult.failed) {
          videoWarnings.push(`${videoResult.failed} video job(s) could not be queued.`);
        }
      } catch (error) {
        videoWarnings.push(
          `Video queue unavailable: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    progress.emit('complete', 'Course Factory complete.', 100);
    return {
      ok: true,
      courseId: publishResult.courseId,
      courseSlug: blueprint.programSlug || undefined,
      title: blueprint.credentialTitle,
      moduleCount: publishResult.moduleCount,
      lessonCount: publishResult.lessonCount,
      skippedCount: publishResult.skippedCount,
      warnings: [
        ...validation.warnings.map((issue) => issue.message),
        ...publishResult.warnings,
        ...videoWarnings,
      ],
      errors: [],
      status: 'success',
    };
  } catch (error) {
    logger.error('[course-factory] Course Factory failed', error);
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

export async function createCourse(input: SimpleCourseInput): Promise<FactoryOutput> {
  return courseFactory({
    programSlug: input.programSlug,
    mode: input.mode ?? 'missing-only',
    contentSource: input.contentSource ?? 'blueprint',
    videoMode: input.includeVideos ? 'queue' : 'off',
  });
}

export async function factoryFromSlug(
  slug: string,
  options?: { mode?: 'replace' | 'missing-only'; contentSource?: 'ai' | 'blueprint' },
): Promise<FactoryOutput> {
  return createCourse({
    programSlug: slug,
    mode: options?.mode ?? 'missing-only',
    contentSource: options?.contentSource ?? 'blueprint',
  });
}
