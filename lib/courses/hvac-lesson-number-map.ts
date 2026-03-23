/**
 * Maps Supabase lesson_number (1-94) to the definition ID used in
 * hvac-lesson-content.ts, hvac-quiz-banks.ts, and related files.
 *
 * Derived from the order in supabase/migrations/20260219000001_hvac_course_94_lessons.sql.
 * lesson_number is the third column in each INSERT row.
 */

/** lesson_number → definition ID (e.g. 'hvac-01-01') */
export const HVAC_LESSON_NUMBER_TO_DEF_ID: Record<number, string> = {
  // Module 1 — Program Orientation
  1: 'hvac-01-01',
  2: 'hvac-01-02',
  3: 'hvac-01-03',
  4: 'hvac-01-04',
  // Module 2 — HVAC Fundamentals & Safety
  5: 'hvac-02-01',
  6: 'hvac-02-02',
  7: 'hvac-02-03',
  8: 'hvac-02-04',
  9: 'hvac-02-05',
  // Module 3 — Electrical Fundamentals
  10: 'hvac-03-01',
  11: 'hvac-03-02',
  12: 'hvac-03-03',
  13: 'hvac-03-04',
  14: 'hvac-03-05',
  // Module 4 — Heating Systems
  15: 'hvac-04-01',
  16: 'hvac-04-02',
  17: 'hvac-04-03',
  18: 'hvac-04-04',
  19: 'hvac-04-05',
  20: 'hvac-04-06',
  // Module 5 — Refrigeration & Cooling
  21: 'hvac-05-01',
  22: 'hvac-05-02',
  23: 'hvac-05-03',
  24: 'hvac-05-04',
  25: 'hvac-05-05',
  26: 'hvac-05-06',
  // Module 6 — EPA 608 Certification
  27: 'hvac-06-01',
  28: 'hvac-06-02',
  29: 'hvac-06-03',
  30: 'hvac-06-04',
  31: 'hvac-06-05',
  32: 'hvac-06-06',
  33: 'hvac-06-07',
  34: 'hvac-06-08',
  // Module 7 — EPA 608 Type I (Small Appliances)
  35: 'hvac-07-01',
  36: 'hvac-07-02',
  37: 'hvac-07-03',
  38: 'hvac-07-04',
  39: 'hvac-07-05',
  // Module 8 — EPA 608 Type II (High-Pressure)
  40: 'hvac-08-01',
  41: 'hvac-08-02',
  42: 'hvac-08-03',
  43: 'hvac-08-04',
  44: 'hvac-08-05',
  45: 'hvac-08-06',
  46: 'hvac-08-07',
  // Module 9 — EPA 608 Type III (Low-Pressure)
  47: 'hvac-09-01',
  48: 'hvac-09-02',
  49: 'hvac-09-03',
  50: 'hvac-09-04',
  // Module 10 — Airflow & Duct Systems
  51: 'hvac-10-01',
  52: 'hvac-10-02',
  53: 'hvac-10-03',
  54: 'hvac-10-04',
  55: 'hvac-10-05',
  56: 'hvac-10-06',
  // Module 11 — System Installation
  57: 'hvac-11-01',
  58: 'hvac-11-02',
  59: 'hvac-11-03',
  60: 'hvac-11-04',
  61: 'hvac-11-05',
  // Module 12 — Preventive Maintenance
  62: 'hvac-12-01',
  63: 'hvac-12-02',
  64: 'hvac-12-03',
  65: 'hvac-12-04',
  66: 'hvac-12-05',
  67: 'hvac-12-06',
  // Module 13 — Troubleshooting & Diagnostics
  68: 'hvac-13-01',
  69: 'hvac-13-02',
  70: 'hvac-13-03',
  71: 'hvac-13-04',
  72: 'hvac-13-05',
  73: 'hvac-13-06',
  // Module 14 — Advanced Systems
  74: 'hvac-14-01',
  75: 'hvac-14-02',
  76: 'hvac-14-03',
  77: 'hvac-14-04',
  78: 'hvac-14-05',
  79: 'hvac-14-06',
  80: 'hvac-14-07',
  81: 'hvac-14-08',
  // Module 15 — Career Readiness & Employment
  82: 'hvac-15-01',
  83: 'hvac-15-02',
  84: 'hvac-15-03',
  85: 'hvac-15-04',
  86: 'hvac-15-05',
  // Module 16 — Capstone & Certification Prep
  87: 'hvac-16-01',
  88: 'hvac-16-02',
  89: 'hvac-16-03',
  90: 'hvac-16-04',
  91: 'hvac-16-05',
  // Lessons 92–95 use slug-based keys (no module/lesson sub-ID)
  92: 'hvac-lesson-92',
  93: 'hvac-lesson-93',
  94: 'hvac-lesson-94',
  95: 'hvac-lesson-95',
};

/** Returns the module ID (e.g. 'hvac-05') for a given lesson_number */
export function getModuleIdForLessonNumber(lessonNumber: number): string | null {
  const defId = HVAC_LESSON_NUMBER_TO_DEF_ID[lessonNumber];
  if (!defId) return null;
  const match = defId.match(/^(hvac-\d+)/);
  return match ? match[1] : null;
}
