/**
 * Canonical constants for the barber apprenticeship program.
 *
 * Import from here — never hardcode slugs, IDs, or competency keys inline.
 */

export const BARBER_PROGRAM_SLUG = 'barber-apprenticeship';
export const BARBER_COURSE_ID    = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

/**
 * Maps program slug → canonical LMS course ID.
 * Used wherever an enrollment needs a course_id resolved from a program slug.
 * Keep in sync with grant-access/route.ts.
 */
export const PROGRAM_COURSE_MAP: Record<string, string> = {
  'barber-apprenticeship': BARBER_COURSE_ID,
  'hvac-technician':       'f0593164-55be-5867-98e7-8a86770a8dd0',
};

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
