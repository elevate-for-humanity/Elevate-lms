import { CourseExperienceSchema } from '@/lib/course-factory/experience-contract';
import type { CoursePackage, CoursePackageLesson } from './contract';

export const REQUIRED_COURSE_GATES = [
  'standards',
  'learning_objectives',
  'prerequisites',
  'teaching_sequence',
  'instructional_script',
  'storyboard',
  'visual_assignment',
  'scene_build',
  'natural_narration',
  'synchronization',
  'active_teaching',
  'mistakes_and_corrections',
  'assessment_alignment',
  'render',
  'finished_media_qa',
  'instructional_qa',
  'narration_qa',
  'learner_runthrough',
  'selective_repair',
  'publish',
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

function validateNarrationVisualAlignment(
  lesson: CoursePackageLesson,
  path: string,
): ReadinessFinding[] {
  const timeline = lesson.timeline;
  if (!timeline) return [];
  const findings: ReadinessFinding[] = [];
  const usedAssets = new Map<string, number>();

  for (const visual of timeline.visuals) {
    const visualPath = `${path}.timeline.visuals.${visual.id}`;
    const narrationCueIds = visual.narrationCueIds ?? [];

    if (!visual.teachingPurpose?.trim()) {
      findings.push({
        gate: 'visual_alignment',
        path: visualPath,
        message: 'Visual is missing a teaching purpose tied to the spoken point.',
      });
    }
    if (!narrationCueIds.length) {
      findings.push({
        gate: 'visual_alignment',
        path: visualPath,
        message: 'Visual is not mapped to a narration cue.',
      });
    }
    if (!visual.visualType) {
      findings.push({
        gate: 'visual_alignment',
        path: visualPath,
        message: 'Visual type is missing.',
      });
    }
    if (!visual.source || !visual.licenseStatus) {
      findings.push({
        gate: 'visual_alignment',
        path: visualPath,
        message: 'Visual source and license status must be recorded.',
      });
    }
    if (
      visual.source &&
      !['owned', 'diagram'].includes(visual.source) &&
      !visual.licenseEvidenceUrl
    ) {
      findings.push({
        gate: 'visual_alignment',
        path: visualPath,
        message: 'Third-party media requires a license evidence URL.',
      });
    }
    if (visual.matchScore === undefined || visual.matchScore < 0.75) {
      findings.push({
        gate: 'visual_alignment',
        path: visualPath,
        message: 'Visual-to-narration match score must be at least 0.75.',
      });
    }
    if (visual.assetUrl) {
      usedAssets.set(visual.assetUrl, (usedAssets.get(visual.assetUrl) ?? 0) + 1);
    }
  }

  for (const audio of timeline.audio) {
    const mapped = timeline.visuals.some((visual) => {
      const overlaps = visual.start < audio.end && visual.end > audio.start;
      return overlaps && (visual.narrationCueIds ?? []).includes(audio.id);
    });
    if (!mapped) {
      findings.push({
        gate: 'visual_alignment',
        path: `${path}.timeline.audio.${audio.id}`,
        message: 'Every spoken teaching point requires an overlapping, explicitly mapped teaching visual.',
      });
    }
  }

  for (const [assetUrl, count] of usedAssets) {
    if (count > 2) {
      findings.push({
        gate: 'visual_alignment',
        path: `${path}.timeline.visuals`,
        message: `The same media asset is repeated ${count} times (${assetUrl}). Replace repeated filler with narration-specific visuals.`,
      });
    }
  }

  return findings;
}

function lessonFindings(lesson: CoursePackageLesson): ReadinessFinding[] {
  const path = `modules.lessons.${lesson.slug}`;
  const exp = record(lesson.experience);
  const findings: ReadinessFinding[] = [];
  const isAssessment = ['checkpoint', 'quiz', 'exam', 'final_exam', 'assessment'].includes(lesson.type);
  const isPractical = lesson.practicalRequired === true || ['practical', 'lab', 'assignment'].includes(lesson.type);
  if (!lesson.objectives.length) findings.push({ gate: 'learning_objectives', path, message: 'Lesson has no measurable objectives.' });
  if (!isAssessment && !lesson.competencies.length) findings.push({ gate: 'credential_alignment', path, message: 'Credential lesson has no mapped competencies.' });
  if (!isAssessment && !lesson.html.trim()) findings.push({ gate: 'instructional_content', path, message: 'Lesson has no instructional content.' });
  if (!isAssessment && !lesson.videoUrl && !lesson.storyboard.length) findings.push({ gate: 'demonstration', path, message: 'Lesson has neither an approved video nor a production storyboard.' });
  if (!isAssessment && lesson.storyboard.length < 6) findings.push({ gate: 'storyboard', path, message: 'Credential lesson requires a versioned storyboard with at least six scenes.' });
  if (!isAssessment && record(exp.technicalReview).approved !== true) findings.push({ gate: 'technical_review', path, message: 'Automated or independent technical review has not approved this lesson.' });
  if (!isAssessment && !CourseExperienceSchema.safeParse(exp).success) findings.push({ gate: 'interactive_practice', path, message: 'Complete credential lesson experience is missing or invalid.' });
  if (!isAssessment && !Array.isArray(exp.knowledgeChecks)) findings.push({ gate: 'knowledge_checks', path, message: 'Knowledge checks are missing.' });
  if (!isAssessment && !String(exp.narrationScript ?? '').trim()) findings.push({ gate: 'narration', path, message: 'Narration is missing.' });
  const timeline = lesson.timeline;
  if (!isAssessment) findings.push(...validateNarrationVisualAlignment(lesson, path));
  if (!isAssessment && !timeline?.captions.length) findings.push({ gate: 'captions', path, message: 'Timed captions are missing.' });
  if (!isAssessment && !String(exp.transcript ?? exp.narrationScript ?? '').trim()) findings.push({ gate: 'transcript', path, message: 'Transcript is missing.' });
  if (!isAssessment && (!timeline || lesson.completion.requiredWatchPercent <= 0)) findings.push({ gate: 'progress_tracking', path, message: 'Timeline progress requirements are missing.' });
  if (!isAssessment && !timeline) findings.push({ gate: 'resume_tracking', path, message: 'Timeline required for exact resume location is missing.' });
  if (isPractical && (!lesson.completion.evidenceRequired || !lesson.completion.instructorSignoffRequired)) {
    findings.push({ gate: 'interactive_practice', path, message: 'Practical credential lesson requires evidence submission and instructor sign-off.' });
  }
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
