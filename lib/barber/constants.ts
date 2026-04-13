/**
 * Barber apprenticeship constants.
 *
 * PROGRAM_COURSE_MAP is now canonical in lib/course-builder/schema.ts.
 * Re-exported here for backward compatibility with existing importers.
 */

export { PROGRAM_COURSE_MAP, resolveCourseId } from '@/lib/course-builder/schema';

export const BARBER_PROGRAM_SLUG = 'barber-apprenticeship';
export const BARBER_COURSE_ID    = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

/**
 * Competency keys for the five practical lessons that require instructor sign-off.
 * Keys must exactly match the `key` field in course_lessons.competency_checks JSONB.
 * Source of truth: DB — verified 2026-06.
 */
export const BARBER_COMPETENCY_KEYS = {
  // Lesson 4 — Infection Control & Sanitation
  BARBICIDE_IMMERSION:    'barbicide_immersion',
  RAZOR_BLADE_CHANGE_L4:  'razor_blade_change',   // also appears on lesson 17
  NECK_STRIP_APPLICATION: 'neck_strip_application',

  // Lesson 5 — Chemical Safety & OSHA
  CHEMICAL_STORAGE:       'chemical_storage',
  HAZARD_IDENTIFICATION:  'hazard_identification',

  // Lesson 6 — Client Consultation
  CONSULTATION_LIVE:      'consultation_live',

  // Lesson 15 — Clipper & Trimmer Maintenance
  CLIPPER_MAINTENANCE:    'clipper_maintenance',

  // Lesson 17 — Straight Razor & Shaving
  RAZOR_BLADE_CHANGE:     'razor_blade_change',
  STRAIGHT_RAZOR_GRIP:    'straight_razor_grip',
} as const;

export type BarberCompetencyKey = typeof BARBER_COMPETENCY_KEYS[keyof typeof BARBER_COMPETENCY_KEYS];

/** Lesson slugs for the five practical lessons. */
export const BARBER_PRACTICAL_LESSON_SLUGS = [
  'barber-lesson-4',
  'barber-lesson-5',
  'barber-lesson-6',
  'barber-lesson-15',
  'barber-lesson-17',
] as const;
