import { getAllBlueprints, type CredentialBlueprint } from '@/lib/curriculum/blueprints';
import { buildCanonicalCourseFromBlueprint } from '@/lib/curriculum/builders/buildCanonicalCourseFromBlueprint';
import { requireAdminClient } from '@/lib/supabase/admin';
import { queueCourseLessonVideos } from '@/lib/course-builder/video-queue';
import { generateAndPersistFinalExam, generateAndPersistModuleQuiz } from '@/lib/course-builder/assessment-generator';
import { buildIndustryStandardsBlock } from '@/lib/ai/prompts/course-blueprint';
import { loadIndustryStandards } from '@/lib/industry/standards-loader';
import { generateLessonContent } from '@/lib/course-builder/lesson-content-generator';
import { logger } from '@/lib/logger';

export type ProgramAutoCourseMode = 'replace' | 'missing-only';
export type ProgramAutoCourseVideoMode = 'queue' | 'off';

type ProgramRow = {
  id: string;
  slug: string | null;
  code: string | null;
  credential_type: string | null;
};

function normalize(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function resolveBlueprintForProgram(
  program: ProgramRow,
  blueprints: CredentialBlueprint[],
): CredentialBlueprint | null {
  const slug = normalize(program.slug);
  const code = normalize(program.code);
  const credentialType = normalize(program.credential_type);

  if (slug) {
    const bySlug = blueprints.find((bp) => normalize(bp.programSlug) === slug);
    if (bySlug) return bySlug;
  }

  if (code) {
    const byCode = blueprints.find((bp) => normalize(bp.credentialCode) === code);
    if (byCode) return byCode;
  }

  if (credentialType) {
    const byType = blueprints.find((bp) => normalize(bp.credentialCode) === credentialType);
    if (byType) return byType;
  }

  return null;
}

export async function autoGenerateCourseForProgram(args: {
  programId: string;
  mode?: ProgramAutoCourseMode;
  videoMode?: ProgramAutoCourseVideoMode;
  videoQueueLimit?: number | null;
}) {
  const db = await requireAdminClient();
  const mode = args.mode ?? 'missing-only';
  const videoMode = args.videoMode ?? 'queue';

  const { data: program } = await db
    .from('programs')
    .select('id, slug, code, credential_type')
    .eq('id', args.programId)
    .maybeSingle<ProgramRow>();

  if (!program) {
    return {
      ok: false as const,
      status: 'not_found' as const,
      error: 'Program not found',
    };
  }

  const blueprints = await getAllBlueprints();
  const blueprint = resolveBlueprintForProgram(program, blueprints);
  if (!blueprint) {
    return {
      ok: false as const,
      status: 'no_blueprint' as const,
      error: 'No registered blueprint matches this program',
      programSlug: program.slug,
    };
  }

  let standardsBlock: string | undefined;
  if (blueprint.socCode) {
    try {
      const standards = await loadIndustryStandards(blueprint.socCode, blueprint.credentialCode);
      if (standards) {
        standardsBlock = buildIndustryStandardsBlock(standards);
      }
    } catch {
      standardsBlock = undefined;
    }
  }

  const enrichedBlueprint = {
    ...blueprint,
    modules: blueprint.modules.map((module) => ({ ...module })),
  };

  const expectedLessonCount = blueprint.modules.reduce(
    (acc, module) => acc + (blueprintMod.lessons?.length ?? 0),
    0,
  );
  const generationFailures: Array<{ slug: string; reason: string }> = [];

  for (const mod of enrichedBlueprint.modules) {
    const enrichedLessons: typeof mod.lessons = [];

    for (const lesson of mod.lessons ?? []) {
      try {
        const generated = await generateLessonContent(
          lesson,
          mod.title,
          blueprint.credentialTitle,
          blueprint.state ?? 'Indiana',
          standardsBlock,
        );

        enrichedLessons.push({
          ...lesson,
          objective: generated.objective,
          content: generated.content,
          quizQuestions: generated.quiz_questions.map((question) => ({
            question: question.question,
            options: question.options,
            correctAnswer: question.correct,
            explanation: question.explanation,
          })),
          passingScore: lesson.passingScore ?? (lesson.slug.includes('exam') ? 80 : 70),
        });
      } catch (error) {
        generationFailures.push({
          slug: lesson.slug,
          reason: error instanceof Error ? error.message : 'lesson content generation failed',
        });
        enrichedLessons.push(lesson);
      }
    }

    mod.lessons = enrichedLessons;
  }

  const build = await buildCanonicalCourseFromBlueprint({
    blueprint: enrichedBlueprint,
    programId: program.id,
    mode,
  });

  const insertedOrRetained = build.lessonCount + build.skipped;
  const completionRatio = expectedLessonCount > 0 ? insertedOrRetained / expectedLessonCount : 1;
  const hasContentFailures =
    generationFailures.length > 0 ||
    build.contentFailures.length > 0 ||
    (expectedLessonCount > 0 && completionRatio < 1);

  if (hasContentFailures) {
    logger.error('[course-builder] Incomplete course build detected', undefined, {
      programId: program.id,
      blueprintId: blueprint.id,
      expectedLessonCount,
      lessonCount: build.lessonCount,
      skipped: build.skipped,
      completionRatio,
      generationFailures: generationFailures.length,
      contentFailures: build.contentFailures.length,
      warnings: build.warnings,
    });

    if (build.courseId) {
      await db
        .from('courses')
        .update({
          status: 'draft',
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', build.courseId);
    }

    return {
      ok: false as const,
      status: 'incomplete_course' as const,
      error: 'Course generation incomplete — one or more lessons failed quality checks',
      blueprintId: blueprint.id,
      blueprintProgramSlug: blueprint.programSlug,
      courseId: build.courseId,
      expectedLessonCount,
      lessonCount: build.lessonCount,
      skipped: build.skipped,
      completionRatio,
      generationFailures,
      contentFailures: build.contentFailures,
      warnings: build.warnings,
    };
  }

  if (build.courseId) {
    const { data: lessons } = await db
      .from('course_lessons')
      .select('id, slug, lesson_type, module_id')
      .eq('course_id', build.courseId);

    for (const lesson of lessons ?? []) {
      if (lesson.lesson_type === 'exam') {
        await generateAndPersistFinalExam(db, {
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          courseTitle: blueprint.credentialTitle,
          questionCount: 25,
          passingScore: 80,
        });
      } else if (['checkpoint', 'quiz'].includes(lesson.lesson_type)) {
        await generateAndPersistModuleQuiz(db, {
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          moduleTitle:
            enrichedBlueprint.modules.find((module) =>
              blueprintMod.lessons?.some((entry) => entry.slug === lesson.slug),
            )?.title ?? blueprint.credentialTitle,
          questionCount: 8,
          passingScore: 70,
        });
      }
    }
  }

  let videoQueue = null;
  if (videoMode === 'queue' && build.courseId) {
    videoQueue = await queueCourseLessonVideos({
      courseId: build.courseId,
      onlyMissing: true,
      limit: typeof args.videoQueueLimit === 'number' ? args.videoQueueLimit : null,
    });
  }

  return {
    ok: true as const,
    status: 'generated' as const,
    blueprintId: blueprint.id,
    blueprintProgramSlug: blueprint.programSlug,
    courseId: build.courseId,
    moduleCount: build.moduleCount,
    lessonCount: build.lessonCount,
    expectedLessonCount,
    completionRatio,
    warnings: build.warnings,
    videoQueue,
  };
}
