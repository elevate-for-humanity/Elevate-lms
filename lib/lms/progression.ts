/**
 * LMS progression logic — pure functions, no DB, no React.
 *
 * These are the single source of truth for unlock/completion rules.
 * Use them in components, API routes, and server actions — never
 * reimplement the logic inline.
 */

/**
 * A lesson is unlocked when:
 * - It is the first lesson in its module (idx === 0), OR
 * - The previous lesson in the module is completed
 */
export function isLessonUnlocked(
  idx: number,
  lessonIds: string[],
  progressMap: Record<string, { completed?: boolean } | undefined>,
): boolean {
  if (idx === 0) return true;
  const prevId = lessonIds[idx - 1];
  return !!progressMap[prevId]?.completed;
}

/**
 * A module is unlocked when all lessons in the previous module are complete,
 * or it is the first module (idx === 0).
 */
export function isModuleUnlocked(
  idx: number,
  modules: Array<{ lessons: Array<{ id: string }> }>,
  progressMap: Record<string, { completed?: boolean } | undefined>,
): boolean {
  if (idx === 0) return true;
  const prevModule = modules[idx - 1];
  return prevModule.lessons.every((l) => !!progressMap[l.id]?.completed);
}

/**
 * Returns completion percentage for a set of lesson IDs (0–100).
 */
export function moduleProgress(
  lessonIds: string[],
  progressMap: Record<string, { completed?: boolean } | undefined>,
): number {
  if (lessonIds.length === 0) return 0;
  const done = lessonIds.filter((id) => !!progressMap[id]?.completed).length;
  return Math.round((done / lessonIds.length) * 100);
}

/**
 * Returns true when every lesson in every module is complete.
 */
export function isCourseComplete(
  modules: Array<{ lessons: Array<{ id: string }> }>,
  progressMap: Record<string, { completed?: boolean } | undefined>,
): boolean {
  return modules.every((m) => m.lessons.every((l) => !!progressMap[l.id]?.completed));
}
