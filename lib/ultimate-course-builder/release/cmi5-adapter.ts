import type { UltimateLmsCoursePackage } from './lms-package';
import { validateLmsCoursePackage } from './lms-package';

export interface UltimateCmi5CourseStructure {
  courseId: string;
  title: string;
  moveOn: 'CompletedAndPassed';
  aus: Array<{
    id: string;
    title: string;
    launchMethod: 'OwnWindow';
    masteryScore?: number;
    objectives: string[];
  }>;
}

/**
 * Adapts the canonical Ultimate LMS package to a cmi5 course structure.
 * This deliberately does not create a second course model: the Ultimate
 * package remains authoritative and the adapter is export-only.
 */
export function buildCmi5CourseStructure(
  course: UltimateLmsCoursePackage,
): UltimateCmi5CourseStructure {
  const valid = validateLmsCoursePackage(course);
  if (!valid.pass) {
    throw new Error(`ULTIMATE_CMI5_PACKAGE_INCOMPLETE:${valid.missing.join(',')}`);
  }

  return {
    courseId: course.id,
    title: course.title,
    moveOn: 'CompletedAndPassed',
    aus: course.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      launchMethod: 'OwnWindow',
      objectives: lesson.objectives,
    })),
  };
}

export function buildCmi5CourseXml(course: UltimateLmsCoursePackage): string {
  const structure = buildCmi5CourseStructure(course);
  const esc = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const aus = structure.aus
    .map(
      (au) =>
        `<au id="${esc(au.id)}" moveOn="${structure.moveOn}" launchMethod="${au.launchMethod}"><title>${esc(au.title)}</title></au>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><courseStructure id="${esc(structure.courseId)}"><title>${esc(structure.title)}</title><aus>${aus}</aus></courseStructure>`;
}
