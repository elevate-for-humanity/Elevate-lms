// Production recovery runner for the canonical Cosmetology course.
import { courseFactory } from '../../lib/course-factory';
import { normalizeGeneratedCourseForGovernance } from '../../lib/course-factory/post-generation-governance';
import { requireAdminClient } from '../../lib/supabase/admin';

// Governance reads canonical learning_objectives/content; recovery is scoped to Cosmetology. Barbering remains a separate
// canonical course and must never block or consume this course's recovery run.
const TARGETS = [
  {
    programSlug: 'cosmetology-apprenticeship',
    title: 'Indiana Cosmetology License',
    topic: 'Indiana cosmetology apprenticeship theory and practical preparation',
    expectedModules: 8,
    expectedLessons: 40,
  },
] as const;
let failureStage = 'startup';

async function normalizePersistedCourse(target: (typeof TARGETS)[number]) {
  if (process.env.COURSE_FACTORY_FORCE_REGENERATE === 'true') return null;

  const db = await requireAdminClient();
  const { data: course, error } = await db
    .from('courses')
    .select('id')
    .eq('slug', target.programSlug)
    .maybeSingle();
  if (error) throw error;
  if (!course?.id) return null;

  const [{ count: moduleCount, error: moduleError }, { count: lessonCount, error: lessonError }] =
    await Promise.all([
      db
        .from('course_modules')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', course.id),
      db
        .from('course_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', course.id),
    ]);
  if (moduleError) throw moduleError;
  if (lessonError) throw lessonError;
  if (moduleCount !== target.expectedModules || lessonCount !== target.expectedLessons) {
    throw new Error(
      `${target.programSlug} persisted package is incomplete: ${moduleCount ?? 0}/${target.expectedModules} modules, ${lessonCount ?? 0}/${target.expectedLessons} lessons`,
    );
  }

  const governance = await normalizeGeneratedCourseForGovernance(course.id);
  if (governance.lessonsNormalized !== lessonCount || governance.warnings.length) {
    throw new Error(
      `${target.programSlug} governance normalization failed: ${governance.lessonsNormalized}/${lessonCount} lessons; ${JSON.stringify(governance.warnings)}`,
    );
  }
  return { courseId: course.id, moduleCount, lessonCount, governance };
}

async function main() {
  for (const target of TARGETS) {
    const { programSlug } = target;
    failureStage = `${programSlug}-persisted-governance`;
    const persisted = await normalizePersistedCourse(target);
    if (persisted) {
      console.log(
        `COURSE_REGENERATION_SUCCESS ${programSlug} ${persisted.courseId} ${persisted.moduleCount} ${persisted.lessonCount} ${persisted.governance.totalDurationHours}h normalized-existing`,
      );
      continue;
    }

    failureStage = `${programSlug}-course-factory`;
    console.log(`
=== Regenerating ${programSlug} ===`);
    const result = await courseFactory(
      {
        programSlug,
        title: target.title,
        topic: target.topic,
        mode: 'refresh',
        contentSource: 'blueprint',
        videoMode: 'queue',
      },
      (stage, message, progress) =>
        console.log(`[${programSlug}] ${stage} ${progress ?? ''} ${message}`),
    );

    failureStage = `${programSlug}-validation-${result.status ?? 'unknown'}`;
    if (!result.ok) {
      const db = await requireAdminClient();
      const { error: logError } = await db.from('ai_course_generation_log').insert({
        action: 'course_regeneration_failure',
        details: {
          programSlug,
          errors: result.errors ?? [],
          generationFailures: result.generationFailures ?? [],
          moduleCount: result.moduleCount ?? 0,
          lessonCount: result.lessonCount ?? 0,
        },
      });
      if (logError) {
        console.error(
          `[course-regeneration] unable to persist private diagnostic: ${logError.message}`,
        );
      }
      throw new Error(
        `${programSlug} regeneration failed: ${JSON.stringify(result.errors ?? result.generationFailures ?? result)}`,
      );
    }
    if (result.courseSlug !== programSlug) {
      throw new Error(`${programSlug} persisted to unexpected slug ${result.courseSlug}`);
    }
    if ((result.moduleCount ?? 0) < 1 || (result.lessonCount ?? 0) < 1) {
      throw new Error(
        `${programSlug} persisted incomplete package: ${result.moduleCount ?? 0} modules, ${result.lessonCount ?? 0} lessons`,
      );
    }

    failureStage = `${programSlug}-governance-normalization`;
    const governance = await normalizeGeneratedCourseForGovernance(result.courseId);
    if (governance.lessonsNormalized !== result.lessonCount) {
      throw new Error(
        `${programSlug} governance normalized ${governance.lessonsNormalized} of ${result.lessonCount} lessons`,
      );
    }
    if (governance.warnings.length) {
      throw new Error(
        `${programSlug} governance normalization warnings: ${JSON.stringify(governance.warnings)}`,
      );
    }

    console.log(
      `COURSE_REGENERATION_SUCCESS ${programSlug} ${result.courseId} ${result.moduleCount} ${result.lessonCount} ${governance.totalDurationHours}h`,
    );
  }
}

main().catch((error) => {
  console.error(`COURSE_REGENERATION_FAILURE_STAGE ${failureStage}`);
  console.error(error);
  process.exit(1);
});
