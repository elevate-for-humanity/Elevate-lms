import { requireAdminClient } from '@/lib/supabase/admin';
import { CourseExperienceSchema } from './experience-contract';

export type CanonicalGateFinding = {
  gate: string;
  lessonId?: string;
  message: string;
};

export async function evaluatePersistedCredentialCourse(courseId: string) {
  const db = await requireAdminClient();
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,program_id,governing_body,governing_standard_version,compliance_profile_key')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError) throw courseError;

  const { data: lessons, error: lessonsError } = await db
    .from('course_lessons')
    .select('id,title,learning_objectives,domain_key,content_json')
    .eq('course_id', courseId);
  if (lessonsError) throw lessonsError;

  const findings: CanonicalGateFinding[] = [];
  if (!course) {
    return {
      pass: false,
      findings: [{ gate: 'identity', message: 'Canonical course record is missing.' }],
    };
  }

  if (!course.program_id) {
    findings.push({ gate: 'identity', message: 'Program ownership is missing.' });
  }
  if (!course.governing_body) {
    findings.push({ gate: 'credential_alignment', message: 'Governing body is missing.' });
  }
  if (!course.governing_standard_version) {
    findings.push({
      gate: 'credential_alignment',
      message: 'Governing standard version is missing.',
    });
  }
  if (!course.compliance_profile_key) {
    findings.push({
      gate: 'credential_alignment',
      message: 'Compliance/credential profile is missing.',
    });
  }
  if (!lessons?.length) {
    findings.push({ gate: 'instructional_content', message: 'Course has no canonical lessons.' });
  }

  for (const lesson of lessons ?? []) {
    const experience = (lesson.content_json as Record<string, unknown> | null)?.experience as
      | Record<string, unknown>
      | undefined;
    const lessonId = lesson.id as string;
    const title = String(lesson.title ?? 'Untitled lesson');

    if (!Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length === 0) {
      findings.push({
        gate: 'learning_objectives',
        lessonId,
        message: `${title}: objectives are missing.`,
      });
    }
    if (!lesson.domain_key) {
      findings.push({
        gate: 'credential_alignment',
        lessonId,
        message: `${title}: standards/competency domain is missing.`,
      });
    }
    if (!CourseExperienceSchema.safeParse(experience).success) {
      findings.push({
        gate: 'instructional_content',
        lessonId,
        message: `${title}: complete Course Experience contract is missing or invalid.`,
      });
    }

    const timeline = experience?.instructionalTimeline as
      | { scenes?: unknown[] }
      | undefined;
    if (!timeline || !Array.isArray(timeline.scenes) || timeline.scenes.length < 6) {
      findings.push({
        gate: 'storyboard',
        lessonId,
        message: `${title}: six-scene instructional timeline is missing.`,
      });
    }
    if (!String(experience?.narrationScript ?? '').trim()) {
      findings.push({
        gate: 'narration',
        lessonId,
        message: `${title}: professional narration script is missing.`,
      });
    }
  }

  return { pass: findings.length === 0, findings };
}
