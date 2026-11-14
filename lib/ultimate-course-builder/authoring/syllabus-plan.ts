import type { UltimateCredentialProfile } from '../core/types';
import { classifyCompetency } from '../instructional/competency-classification.mjs';
export type SyllabusPlan = {
  text: string;
  modules: Array<{
    title: string;
    lessons: Array<{ title: string; objectives: string[]; content: string }>;
  }>;
};
export function validateSyllabusPlan(input: unknown): input is SyllabusPlan {
  if (!input || typeof input !== 'object') return false;
  const plan = input as SyllabusPlan;
  return (
    typeof plan.text === 'string' &&
    plan.text.trim().length > 0 &&
    plan.text.length <= 250000 &&
    Array.isArray(plan.modules) &&
    plan.modules.length > 0 &&
    plan.modules.length <= 100 &&
    plan.modules.every(
      (m) =>
        typeof m.title === 'string' &&
        m.title.trim().length > 0 &&
        m.title.length <= 300 &&
        Array.isArray(m.lessons) &&
        m.lessons.length > 0 &&
        m.lessons.length <= 100 &&
        m.lessons.every(
          (l) =>
            typeof l.content === 'string' &&
            l.content.trim().length > 0 &&
            l.content.length <= 50000 &&
            typeof l.title === 'string' &&
            l.title.trim().length > 0 &&
            l.title.length <= 300 &&
            Array.isArray(l.objectives) &&
            l.objectives.length > 0 &&
            l.objectives.length <= 30 &&
            l.objectives.every(
              (o) => typeof o === 'string' && o.trim().length > 0 && o.length <= 2000,
            ),
        ),
    ) &&
    plan.modules.reduce((total, m) => total + m.lessons.length, 0) <= 500
  );
}
export function applySyllabusPlan(
  profile: UltimateCredentialProfile,
  plan: SyllabusPlan,
): UltimateCredentialProfile {
  // A syllabus supplies instruction; it cannot replace registered competency authority.
  if (profile.authority !== 'course-defined')
    return {
      ...profile,
      instructionalSources: [
        ...(profile.instructionalSources ?? []),
        { id: 'syllabus:uploaded', text: plan.text },
      ],
    };
  const competencies = plan.modules.flatMap((module, mi) =>
    module.lessons.map((lesson, li) => ({
      id: `syllabus-${mi + 1}-${li + 1}`,
      title: `${module.title} · ${lesson.title}`,
      description: lesson.objectives.join('; '),
      ...classifyCompetency(lesson.title),
      authorityRequirementIds: [],
    })),
  );
  return {
    ...profile,
    competencies,
    sourceDocuments: [...profile.sourceDocuments, 'syllabus:uploaded'],
    instructionalSources: [
      ...(profile.instructionalSources ?? []),
      { id: 'syllabus:uploaded', text: plan.text },
      ...plan.modules.flatMap((module, mi) =>
        module.lessons.map((lesson, li) => ({
          id: `course-lesson:syllabus-${mi + 1}-${li + 1}`,
          text: 'Authorized course content: ' + JSON.stringify({ html: lesson.content }),
        })),
      ),
    ],
  };
}
