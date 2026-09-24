import { loadCourseSession } from '@/lib/studio/course-session';
import {
  coursePackageFromSession,
  loadPersistedCoursePackageEvidence,
} from '@/lib/course-package/from-course-session';
import {
  evaluateCourseReadiness,
  REQUIRED_COURSE_GATES,
  type CourseGate,
} from '@/lib/course-package/readiness';

export type CanonicalGateFinding = {
  gate: CourseGate | 'identity';
  lessonId?: string;
  path?: string;
  pass?: boolean;
  message: string;
};

function lessonIdFromPath(
  path: string,
  lessonIdsBySlug: Map<string, string>,
): string | undefined {
  const prefix = 'modules.lessons.';
  if (!path.startsWith(prefix)) return undefined;
  const remainder = path.slice(prefix.length);
  const slug = remainder.split('.')[0];
  return lessonIdsBySlug.get(slug);
}

/**
 * Single persisted-course authority for Course Builder repair and publication.
 *
 * Persisted Studio data is adapted into the same CoursePackage contract used by
 * export/publication. This prevents the repair loop from declaring success
 * against a smaller validator than the production package actually requires.
 */
export async function evaluatePersistedCredentialCourse(courseId: string) {
  const session = await loadCourseSession(courseId, { system: true });

  if (!session.course.program_id) {
    return {
      pass: false,
      gates: Object.fromEntries(
        REQUIRED_COURSE_GATES.map((gate) => [gate, false]),
      ) as Record<CourseGate, boolean>,
      findings: [
        {
          gate: 'identity' as const,
          message: 'Program ownership is missing.',
        },
      ],
    };
  }

  let coursePackage;
  try {
    const evidence = await loadPersistedCoursePackageEvidence(courseId);
    coursePackage = coursePackageFromSession(session, evidence);
  } catch (error) {
    return {
      pass: false,
      gates: Object.fromEntries(
        REQUIRED_COURSE_GATES.map((gate) => [gate, false]),
      ) as Record<CourseGate, boolean>,
      findings: [
        {
          gate: 'instructional_content' as const,
          message:
            error instanceof Error
              ? `Course package contract is invalid: ${error.message}`
              : 'Course package contract is invalid.',
        },
      ],
    };
  }

  const readiness = evaluateCourseReadiness(coursePackage);
  const lessonIdsBySlug = new Map(
    session.lessons.map((lesson) => [lesson.slug, lesson.id]),
  );
  const findings: CanonicalGateFinding[] = readiness.findings.map((finding) => ({
    gate: finding.gate,
    path: finding.path,
    lessonId: lessonIdFromPath(finding.path, lessonIdsBySlug),
    pass: false,
    message: finding.message,
  }));

  return {
    pass: readiness.pass,
    gates: readiness.gates,
    findings,
  };
}
