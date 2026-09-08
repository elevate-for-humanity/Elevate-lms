import { CourseExperienceSchema } from '@/lib/course-factory/experience-contract';
import type { CoursePackage, CoursePackageLesson } from './contract';

export const REQUIRED_COURSE_GATES = [
  'credential_alignment',
  'learning_objectives',
  'instructional_content',
  'demonstration',
  'storyboard',
  'technical_review',
  'interactive_practice',
  'knowledge_checks',
  'module_assessments',
  'practice_exam',
  'narration',
  'captions',
  'transcript',
  'accessibility',
  'learner_preview',
  'progress_tracking',
  'resume_tracking',
] as const;

export type CourseGate = (typeof REQUIRED_COURSE_GATES)[number];
export type ReadinessFinding = { gate: CourseGate; path: string; message: string };
export type CourseReadiness = {
  pass: boolean;
  gates: Record<CourseGate, boolean>;
  findings: ReadinessFinding[];
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function lessonFindings(lesson: CoursePackageLesson): ReadinessFinding[] {
  const path = `modules.lessons.${lesson.slug}`;
  const exp = record(lesson.experience);
  const findings: ReadinessFinding[] = [];
  const isAssessment = ['checkpoint', 'quiz', 'exam', 'final_exam', 'assessment'].includes(lesson.type);
  const isPractical = ['practical', 'lab', 'assignment'].includes(lesson.type);
  if (!lesson.objectives.length) findings.push({ gate: 'learning_objectives', path, message: 'Lesson has no measurable objectives.' });
  if (!isAssessment && !isPractical && !lesson.html.trim()) findings.push({ gate: 'instructional_content', path, message: 'Lesson has no instructional content.' });
  if (!isAssessment && !isPractical && !lesson.videoUrl && !lesson.storyboard.length) findings.push({ gate: 'demonstration', path, message: 'Lesson has neither an approved video nor a production storyboard.' });
  if (!isAssessment && !isPractical && !lesson.storyboard.length) findings.push({ gate: 'storyboard', path, message: 'Versioned scene storyboard is missing.' });
  if (!isAssessment && record(exp.technicalReview).approved !== true) findings.push({ gate: 'technical_review', path, message: 'Independent technical review has not approved this lesson.' });
  if (!isAssessment && (!CourseExperienceSchema.partial().safeParse(exp).success || (!exp.scenario && !exp.caseStudy && !exp.exercises && !exp.hotspots && !exp.dragDrop && !exp.matching && !exp.simulation && !isPractical))) findings.push({ gate: 'interactive_practice', path, message: 'Required applied interaction is missing or invalid.' });
  if (!lesson.questions.length && !Array.isArray(exp.knowledgeChecks) && !isPractical) findings.push({ gate: 'knowledge_checks', path, message: 'Knowledge checks are missing.' });
  if (!isAssessment && !isPractical && !String(exp.narrationScript ?? '').trim()) findings.push({ gate: 'narration', path, message: 'Narration is missing.' });
  const timeline = lesson.timeline;
  if (!isAssessment && !isPractical && !timeline?.captions.length) findings.push({ gate: 'captions', path, message: 'Timed captions are missing.' });
  if (!isAssessment && !isPractical && !String(exp.transcript ?? exp.narrationScript ?? '').trim()) findings.push({ gate: 'transcript', path, message: 'Transcript is missing.' });
  if (!isAssessment && !isPractical && (!timeline || lesson.completion.requiredWatchPercent <= 0)) findings.push({ gate: 'progress_tracking', path, message: 'Timeline progress requirements are missing.' });
  if (!isAssessment && !isPractical && !timeline) findings.push({ gate: 'resume_tracking', path, message: 'Timeline required for exact resume location is missing.' });
  return findings;
}

export function evaluateCourseReadiness(course: CoursePackage): CourseReadiness {
  const findings = course.modules.flatMap((module) => module.lessons.filter((lesson) => lesson.completion.required).flatMap(lessonFindings));
  if (!course.credential.profileKey || !course.credential.governingBody || !course.credential.standardVersion) findings.push({ gate: 'credential_alignment', path: 'credential', message: 'Credential profile, governing body, and standard version are required.' });
  for (const module of course.modules.filter((item) => item.required)) {
    if (!module.lessons.some((lesson) => ['checkpoint', 'quiz', 'assessment', 'exam', 'final_exam'].includes(lesson.type))) findings.push({ gate: 'module_assessments', path: `modules.${module.slug}`, message: 'Required module assessment is missing.' });
  }
  if (!course.modules.some((module) => module.lessons.some((lesson) => ['exam', 'final_exam'].includes(lesson.type)))) findings.push({ gate: 'practice_exam', path: 'modules', message: 'Certification-style practice exam is missing.' });
  if (course.evidence.accessibility?.approved !== true) findings.push({ gate: 'accessibility', path: 'evidence.accessibility', message: 'Accessibility evidence has not passed.' });
  if (course.evidence.learnerPreview?.approved !== true) findings.push({ gate: 'learner_preview', path: 'evidence.learnerPreview', message: 'Exact learner preview has not been approved.' });
  const gates = Object.fromEntries(REQUIRED_COURSE_GATES.map((gate) => [gate, !findings.some((finding) => finding.gate === gate)])) as Record<CourseGate, boolean>;
  return { pass: findings.length === 0, gates, findings };
}
