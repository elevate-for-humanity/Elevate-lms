/**
 * Stable HVAC course and program IDs.
 *
 * These are the canonical DB UUIDs for the HVAC program. They are used in
 * runtime guards (isHvacCourse check) and completion workflow queries.
 * They are NOT used for lesson/module lookups — those come from the DB.
 *
 * HVAC_LESSON_UUID and HVAC_MODULE_UUID maps have been removed.
 * HvacLessonVideo now accepts lessonId (the DB UUID) directly.
 */

export const HVAC_COURSE_ID = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';
export const HVAC_PROGRAM_ID = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';
