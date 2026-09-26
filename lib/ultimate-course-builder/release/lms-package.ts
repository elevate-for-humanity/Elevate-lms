/**
 * Contract for the final Ultimate Course Builder handoff to the LMS.
 *
 * The publisher persists the rich lesson payload as JSON. Keep the nested
 * fields opaque here, but require their presence before marking a course
 * published so a malformed API request cannot silently release partial work.
 */
export interface UltimateLmsLessonPackage {
  id: string;
  objectives: string[];
  film: { videoUrl: string };
  learningObjects: unknown;
  assessment: unknown;
  remediation: unknown;
  masteryRules: unknown;
  careerContext: unknown;
  traceability: unknown;
}

export interface UltimateLmsCoursePackage {
  lessons: UltimateLmsLessonPackage[];
}

export interface LmsPackageValidation {
  pass: boolean;
  missing: string[];
}

const requiredLessonFields = [
  'learningObjects',
  'assessment',
  'remediation',
  'masteryRules',
  'careerContext',
  'traceability',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateLmsCoursePackage(value: unknown): LmsPackageValidation {
  const missing: string[] = [];
  if (!isRecord(value) || !Array.isArray(value.lessons) || value.lessons.length === 0) {
    return { pass: false, missing: ['lessons'] };
  }

  for (const [index, lesson] of value.lessons.entries()) {
    const prefix = `lessons[${index}]`;
    if (!isRecord(lesson)) {
      missing.push(prefix);
      continue;
    }

    if (typeof lesson.id !== 'string' || !lesson.id.trim()) missing.push(`${prefix}.id`);
    if (
      !Array.isArray(lesson.objectives) ||
      lesson.objectives.length === 0 ||
      lesson.objectives.some((objective) => typeof objective !== 'string' || !objective.trim())
    ) {
      missing.push(`${prefix}.objectives`);
    }
    if (
      !isRecord(lesson.film) ||
      typeof lesson.film.videoUrl !== 'string' ||
      !lesson.film.videoUrl.trim()
    ) {
      missing.push(`${prefix}.film.videoUrl`);
    }
    for (const field of requiredLessonFields) {
      if (lesson[field] === null || lesson[field] === undefined) {
        missing.push(`${prefix}.${field}`);
      }
    }
  }

  return { pass: missing.length === 0, missing };
}
