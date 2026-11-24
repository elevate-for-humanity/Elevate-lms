/**
 * lib/ai/course-generation-authority.ts
 *
 * The boundary between "AI generated some course-shaped JSON" and
 * "this is a course".
 *
 * `runAITask({ task: 'course_generation' })` returns raw JSON blueprints
 * from the language model. That output is a DRAFT. It is not a course:
 * it has not passed Course Factory validation, governance, or the
 * government procurement/publish gates, and it has not been persisted
 * through the only authority allowed to do that — `lib/course-factory`
 * (see docs/DEV_STUDIO_CANONICAL_ARCHITECTURE.md, "Course authoring
 * authority").
 *
 * The orchestrator attaches COURSE_GENERATION_AUTHORITY_NOTE to every
 * generation-task result so callers cannot mistake draft output for a
 * published course. Callers that turn generated output into a course
 * must route it through `courseFactory()` / `publishGovernedCourse`.
 */

export const COURSE_GENERATION_AUTHORITY_NOTE =
  'Draft only — must cross Course Factory (courseFactory()/publishGovernedCourse) and the procurement gate before it becomes a course.';

export const COURSE_GENERATION_TASKS = [
  'course_generation',
  'lesson_generation',
  'quiz_generation',
] as const;

export type CourseGenerationTask = (typeof COURSE_GENERATION_TASKS)[number];

export function isCourseGenerationTask(task: string): task is CourseGenerationTask {
  return (COURSE_GENERATION_TASKS as readonly string[]).includes(task);
}

/** What a caller must do with generated output before it is a course. */
export function courseGenerationNextSteps(): string[] {
  return [
    'Human review of the draft output.',
    'Route through Course Factory (courseFactory() / publishGovernedCourse).',
    'Pass the government procurement/publish gates.',
    'Persist via Course Factory only — no direct writes to course/module/lesson tables.',
  ];
}
