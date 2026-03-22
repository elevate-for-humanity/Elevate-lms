/**
 * Single integration point for admin-triggered course generation.
 *
 * Bind this wrapper to the repo's real generator that writes to course_lessons
 * (the table lms_lessons view reads from). Do not wire to curriculum_lessons
 * or training_lessons — those are not the learner-facing source.
 *
 * To bind: replace the throw below with an import of the real generator.
 * Example:
 *   const { CurriculumGenerator } = await import('@/lib/services/curriculum-generator')
 *   const gen = new CurriculumGenerator(args.courseId, null, 'seed_missing')
 *   // ... call gen.upsertModule / gen.upsertLesson per blueprint
 *   return gen.summarize()
 */

export type GenerateCourseArgs = {
  courseId: string;
  blueprintSlug: string;
  mode: 'full' | 'missing-only';
};

export async function generateCourseFromBlueprint(args: GenerateCourseArgs): Promise<unknown> {
  // Intentional fail-fast — do not remove until bound to the live pipeline.
  throw new Error(
    `generateCourseFromBlueprint is not yet wired to the live generator.\n` +
    `Course: ${args.courseId} | Blueprint: ${args.blueprintSlug} | Mode: ${args.mode}\n` +
    `Bind this wrapper to the generator that writes to course_lessons.`
  );
}
