/**
 * lib/course-builder/hours-engine.ts
 *
 * Assigns and validates instructional hours for generated courses.
 *
 * Rules:
 *   - Every lesson must have a duration_minutes value — never null
 *   - Default ranges are per lesson type (spec §13)
 *   - Module hours = sum of lesson durations
 *   - Course hours = sum of module hours
 *   - minimumHours validation hard-fails if the course falls short
 */

import type { LessonType } from './schema';
import type { CourseModule, CourseTemplate } from './schema';

// ─── Default duration ranges by lesson type ───────────────────────────────────
// Values are [min, default, max] in minutes.

export const DURATION_RANGES: Record<LessonType, [number, number, number]> = {
  lesson:        [20,  30,  45],
  video:         [10,  20,  30],
  checkpoint:    [10,  15,  20],
  quiz:          [15,  20,  30],
  lab:           [30,  60,  90],
  assignment:    [30,  60, 120],
  exam:          [60,  90, 120],
  certification: [ 5,  10,  15],
};

/**
 * Returns the default duration in minutes for a given lesson type.
 * Used by the compiler when durationMinutes is not explicitly set.
 */
export function assignDuration(type: LessonType): number {
  return DURATION_RANGES[type]?.[1] ?? 30;
}

/**
 * Returns the minimum allowed duration for a lesson type.
 */
export function minDuration(type: LessonType): number {
  return DURATION_RANGES[type]?.[0] ?? 10;
}

/**
 * Returns the maximum allowed duration for a lesson type.
 */
export function maxDuration(type: LessonType): number {
  return DURATION_RANGES[type]?.[2] ?? 120;
}

// ─── Module hours ─────────────────────────────────────────────────────────────

/**
 * Sums the duration_minutes of all lessons in a module.
 * Returns hours as a decimal (e.g. 90 minutes → 1.5 hours).
 */
export function sumModuleHours(mod: CourseModule): number {
  const totalMinutes = mod.lessons.reduce(
    (sum, lesson) => sum + (lesson.durationMinutes ?? assignDuration(lesson.type)),
    0,
  );
  return totalMinutes / 60;
}

// ─── Course hours ─────────────────────────────────────────────────────────────

/**
 * Sums all module hours for a course template.
 * Returns hours as a decimal.
 */
export function sumCourseHours(template: CourseTemplate): number {
  return template.modules.reduce((sum, mod) => sum + sumModuleHours(mod), 0);
}

// ─── Hours validation ─────────────────────────────────────────────────────────

export type HoursValidationResult = {
  valid: boolean;
  totalHours: number;
  minimumHours: number;
  shortfallHours: number;
  moduleBreakdown: { slug: string; title: string; hours: number }[];
  errors: string[];
  warnings: string[];
};

/**
 * Validates that a course template meets its minimumHours requirement.
 * Also checks for null durations and out-of-range values.
 */
export function validateHours(template: CourseTemplate): HoursValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const minimumHours = template.minimumHours ?? 0;

  const moduleBreakdown = template.modules.map(mod => ({
    slug: mod.slug,
    title: mod.title,
    hours: sumModuleHours(mod),
  }));

  const totalHours = moduleBreakdown.reduce((s, m) => s + m.hours, 0);

  // Check for null durations
  for (const mod of template.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.durationMinutes == null) {
        errors.push(`${mod.slug}/${lesson.slug}: duration_minutes is null — run assignDurations first`);
      } else if (lesson.durationMinutes < minDuration(lesson.type)) {
        warnings.push(
          `${mod.slug}/${lesson.slug}: duration ${lesson.durationMinutes}m is below minimum ${minDuration(lesson.type)}m for type '${lesson.type}'`,
        );
      } else if (lesson.durationMinutes > maxDuration(lesson.type)) {
        warnings.push(
          `${mod.slug}/${lesson.slug}: duration ${lesson.durationMinutes}m exceeds maximum ${maxDuration(lesson.type)}m for type '${lesson.type}'`,
        );
      }
    }
  }

  // Check minimum hours
  const shortfallHours = Math.max(0, minimumHours - totalHours);
  if (minimumHours > 0 && totalHours < minimumHours) {
    errors.push(
      `Course total ${totalHours.toFixed(1)}h is below minimumHours ${minimumHours}h (shortfall: ${shortfallHours.toFixed(1)}h)`,
    );
  }

  return {
    valid: errors.length === 0,
    totalHours,
    minimumHours,
    shortfallHours,
    moduleBreakdown,
    errors,
    warnings,
  };
}

// ─── Certificate hours write ──────────────────────────────────────────────────

/**
 * Computes the hours to write to program_completion_certificates.hours_completed.
 *
 * Priority:
 *   1. Actual field_hours_logs minutes (if available)
 *   2. Sum of completed lesson durations
 *   3. Course template total hours (fallback)
 */
export function computeCertificateHours(opts: {
  fieldMinutes?: number;
  completedLessonMinutes?: number;
  templateTotalHours?: number;
}): number {
  if (opts.fieldMinutes != null && opts.fieldMinutes > 0) {
    return Math.round((opts.fieldMinutes / 60) * 100) / 100;
  }
  if (opts.completedLessonMinutes != null && opts.completedLessonMinutes > 0) {
    return Math.round((opts.completedLessonMinutes / 60) * 100) / 100;
  }
  return opts.templateTotalHours ?? 0;
}
