/**
 * Maps module order_index → lesson_numbers for the HVAC course.
 *
 * Modules 14 and 15 are consolidated: OSHA 30 and CPR/First Aid
 * are delivered by CareerSafe as external modules, so each maps
 * to a single reading lesson rather than the original 8 and 5.
 */
export const LESSON_MODULE_MAP: Record<number, number[]> = {
  1: [1, 2, 3, 4],
  2: [5, 6, 7, 8, 9],
  3: [10, 11, 12, 13, 14],
  4: [15, 16, 17, 18, 19, 20],
  5: [21, 22, 23, 24, 25, 26],
  6: [27, 28, 29, 30, 31, 32, 33, 34],
  7: [35, 36, 37, 38, 39],
  8: [40, 41, 42, 43, 44, 45, 46],
  9: [47, 48, 49, 50, 51, 52],
  10: [53, 54, 55, 56, 57, 58, 59],
  11: [60, 61, 62, 63, 64],
  12: [65, 66, 67, 68, 69, 70],
  13: [71, 72, 73, 74, 75, 76],
  14: [77],              // OSHA 30 — CareerSafe external module
  15: [85],              // CPR/First Aid/AED — CareerSafe external module
  16: [90, 91, 92, 93, 94, 95],
};

export function getModuleForLesson(lessonNumber: number): number {
  for (const [moduleIdx, lessons] of Object.entries(LESSON_MODULE_MAP)) {
    if (lessons.includes(lessonNumber)) return parseInt(moduleIdx);
  }
  return 0;
}
