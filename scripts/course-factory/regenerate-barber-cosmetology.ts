// Production recovery runner for the canonical Cosmetology course.
import { courseFactory } from '../../lib/course-factory';
import { normalizeGeneratedCourseForGovernance } from '../../lib/course-factory/post-generation-governance';
import { requireAdminClient } from '../../lib/supabase/admin';

// This supervised recovery is scoped to Cosmetology. Barbering remains a separate
// canonical course and must never block or consume this course's recovery run.
const TARGETS = ['cosmetology-apprenticeship'] as const;
let failureStage = 'startup';

async function main() {
  for (const programSlug of TARGETS) {
    failureStage = `${programSlug}-course-factory`;
    console.log(`
=== Regenerating ${programSlug} ===`);
    const result = await courseFactory(
      {
        programSlug,
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
