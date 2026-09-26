export interface UltimateLmsLessonPackage {
  id: string;
  title: string;
  objectives: string[];
  film: { videoUrl: string; captionsUrl?: string; transcript?: string };
  learningObjects: unknown[];
  assessment: unknown;
  remediation: unknown;
  masteryRules: unknown[];
  careerContext: unknown;
  traceability: unknown[];
}

export interface UltimateLmsCoursePackage {
  id: string;
  title: string;
  credentialProfileId: string;
  lessons: UltimateLmsLessonPackage[];
  moduleAssessments: unknown[];
  practiceExam?: unknown;
  careerContext: unknown;
  traceability: unknown[];
}

export function validateLmsCoursePackage(p: UltimateLmsCoursePackage) {
  const missing: string[] = [];
  if (!p.id) missing.push('id');
  if (!p.title) missing.push('title');
  if (!p.credentialProfileId) missing.push('credentialProfileId');
  if (!Array.isArray(p.lessons) || !p.lessons.length) missing.push('lessons');
  if (!Array.isArray(p.moduleAssessments) || !p.moduleAssessments.length) missing.push('moduleAssessments');
  if (!Array.isArray(p.traceability) || !p.traceability.length) missing.push('traceability');

  for (const lesson of p.lessons ?? []) {
    if (!lesson.id) missing.push('lesson.id');
    if (!lesson.film?.videoUrl) missing.push(`lesson.${lesson.id || 'unknown'}.film.videoUrl`);
    if (!lesson.objectives?.length) missing.push(`lesson.${lesson.id || 'unknown'}.objectives`);
    if (!lesson.learningObjects?.length) missing.push(`lesson.${lesson.id || 'unknown'}.learningObjects`);
    if (!lesson.masteryRules?.length) missing.push(`lesson.${lesson.id || 'unknown'}.masteryRules`);
    if (!lesson.traceability?.length) missing.push(`lesson.${lesson.id || 'unknown'}.traceability`);
  }

  return { pass: missing.length === 0, missing: [...new Set(missing)] };
}
