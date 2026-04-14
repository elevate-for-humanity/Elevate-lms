/**
 * lib/course-builder/validate.ts
 *
 * Barber-grade validator for CourseLesson, CourseModule, and CourseTemplate.
 *
 * Per-lesson rules:
 *   - slug, title, type, ≥1 objective required
 *   - Assessed (quiz/checkpoint/exam): quizQuestions ≥5 + passingScore
 *   - Content lessons: content ≥200 chars OR videoUrl
 *   - Theory lessons must NOT have passingScore (prevents false gates)
 *   - Activity↔content: every declared activity must have backing content
 *   - checkpoint/exam must not declare video activity without videoUrl
 *   - practicalRequired required when competencyChecks present
 *   - All competency keys must be in the registry
 *
 * Per-module sequence rules:
 *   - Checkpoint/exam cannot be the first lesson
 *   - Practical must follow at least one content lesson
 *   - No two consecutive checkpoints
 *
 * Course-level rules:
 *   - programSlug must resolve to a courseId
 *   - No duplicate lesson slugs
 *   - Exam must be the last lesson if present
 *   - Course must have at least one assessed lesson
 */

import {
  ASSESSED_LESSON_TYPES,
  CONTENT_LESSON_TYPES,
  DEFAULT_ACTIVITIES,
  type ActivityType,
  type CourseLesson,
  type CourseModule,
  type CourseTemplate,
} from './schema';
import { findUnregisteredKeys, getCompetenciesForProgram } from './competencies';
import { resolveCourseId } from './schema';
import { validateHours } from './hours-engine';

// ─── Result types ─────────────────────────────────────────────────────────────

export type LessonValidationError = {
  moduleSlug: string;
  lessonSlug: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
};

export type CourseValidationResult = {
  valid: boolean;
  errors: LessonValidationError[];
  warnings: LessonValidationError[];
  lessonCount: number;
  errorCount: number;
  warningCount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function visibleLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').trim().length;
}

function mkErr(
  moduleSlug: string, lessonSlug: string, field: string,
  message: string, severity: 'error' | 'warning' = 'error',
): LessonValidationError {
  return { moduleSlug, lessonSlug, field, message, severity };
}

// ─── Activity↔content rules ───────────────────────────────────────────────────

const ACTIVITY_REQUIRES: Partial<Record<ActivityType, (l: CourseLesson) => boolean>> = {
  video:      l => !!l.videoUrl,
  reading:    l => !!(l.content && visibleLength(l.content) >= 50),
  lab:        l => !!(l.practicalRequired && l.competencyChecks?.length),
  checkpoint: l => !!(l.quizQuestions?.length && l.passingScore != null),
  quiz:       l => !!(l.quizQuestions?.length && l.passingScore != null),
};

const ACTIVITY_HINT: Partial<Record<ActivityType, string>> = {
  video:      'add videoUrl',
  reading:    'add content with ≥50 visible characters',
  lab:        'set practicalRequired=true and add competencyChecks',
  checkpoint: 'add quizQuestions (≥5) and passingScore',
  quiz:       'add quizQuestions (≥5) and passingScore',
};

function validateActivities(lesson: CourseLesson, moduleSlug: string): LessonValidationError[] {
  const errs: LessonValidationError[] = [];
  const declared = lesson.activities?.map(a => a.type);
  const effective: ActivityType[] = declared ?? (DEFAULT_ACTIVITIES[lesson.type] ?? []);

  for (const activity of effective) {
    const check = ACTIVITY_REQUIRES[activity];
    if (check && !check(lesson)) {
      errs.push(mkErr(moduleSlug, lesson.slug, 'activities',
        `activity '${activity}' declared but no backing content — ${ACTIVITY_HINT[activity] ?? 'add required content'}`));
    }
  }

  // Hard rule: checkpoint/exam must never show a video tab without a URL
  if (['checkpoint', 'exam'].includes(lesson.type) && effective.includes('video') && !lesson.videoUrl) {
    errs.push(mkErr(moduleSlug, lesson.slug, 'activities',
      `${lesson.type} has a 'video' activity but no videoUrl — remove the video activity or add a URL`));
  }

  return errs;
}

// ─── Per-lesson validator ─────────────────────────────────────────────────────

export function validateCourseLesson(lesson: CourseLesson, moduleSlug: string): LessonValidationError[] {
  const errs: LessonValidationError[] = [];
  const e = (field: string, message: string, severity: 'error' | 'warning' = 'error') =>
    errs.push(mkErr(moduleSlug, lesson.slug, field, message, severity));

  // Identity
  if (!lesson.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lesson.slug))
    e('slug', 'must be lowercase kebab-case');
  if (!lesson.title || lesson.title.trim().length < 3)
    e('title', 'must be at least 3 characters');
  if (!lesson.type)
    e('type', 'lesson type is required');

  // Objectives
  if (!lesson.learningObjectives || lesson.learningObjectives.length === 0) {
    e('learningObjectives', 'at least one learning objective is required');
  } else {
    const generic = lesson.learningObjectives.filter(
      o => o.toLowerCase().startsWith('understand') && o.split(' ').length < 5);
    if (generic.length > 0)
      e('learningObjectives', `${generic.length} objective(s) too generic — use measurable verbs (demonstrate, identify, apply)`, 'warning');
  }

  // Content / video
  if (CONTENT_LESSON_TYPES.includes(lesson.type as any)) {
    const hasContent = lesson.content && visibleLength(lesson.content) >= 200;
    if (!hasContent && !lesson.videoUrl)
      e('content', `${lesson.type} requires content (≥200 visible chars) or videoUrl`);
  }

  // Duration — hard fail if null (hours engine must run before publish)
  if (lesson.durationMinutes == null)
    e('durationMinutes', `duration_minutes is null — run the hours engine before publishing`, 'warning');
  else if (lesson.durationMinutes <= 0)
    e('durationMinutes', `duration_minutes must be > 0 (got ${lesson.durationMinutes})`);

  // Assessment
  if (ASSESSED_LESSON_TYPES.includes(lesson.type as any)) {
    if (!lesson.quizQuestions || lesson.quizQuestions.length < 5)
      e('quizQuestions', `${lesson.type} requires ≥5 quiz questions (got ${lesson.quizQuestions?.length ?? 0})`);
    if (lesson.passingScore == null)
      e('passingScore', `${lesson.type} requires a passingScore`);
    else if (lesson.passingScore < 1 || lesson.passingScore > 100)
      e('passingScore', `passingScore must be 1–100 (got ${lesson.passingScore})`);
  }

  // No passingScore on theory lessons
  if (!ASSESSED_LESSON_TYPES.includes(lesson.type as any) && lesson.passingScore != null)
    e('passingScore', `'${lesson.type}' is not assessed — remove passingScore to prevent false gates`, 'warning');

  // Activity↔content integrity
  errs.push(...validateActivities(lesson, moduleSlug));

  // Practical / sign-off
  if (lesson.competencyChecks?.length) {
    if (!lesson.practicalRequired)
      e('practicalRequired', 'lesson has competencyChecks but practicalRequired is not true');
    const unregistered = findUnregisteredKeys(lesson.competencyChecks.map(c => c.key));
    if (unregistered.length > 0)
      e('competencyChecks', `unregistered key(s): ${unregistered.join(', ')} — add to lib/course-builder/competencies.ts`);
    for (const check of lesson.competencyChecks)
      if (check.requiresInstructorSignoff && !check.key)
        e('competencyChecks', 'sign-off check must have a key');
  }
  if (lesson.practicalRequired && !lesson.competencyChecks?.length)
    e('competencyChecks', 'practicalRequired=true but no competencyChecks defined', 'warning');

  // Quiz question structure
  for (const [i, q] of (lesson.quizQuestions ?? []).entries()) {
    if (!q.question || q.question.trim().length < 10)
      e('quizQuestions', `question[${i}] text too short`);
    if (!q.options || q.options.length < 2)
      e('quizQuestions', `question[${i}] needs ≥2 options`);
    if (q.correctAnswer == null || q.correctAnswer < 0 || q.correctAnswer >= (q.options?.length ?? 0))
      e('quizQuestions', `question[${i}] correctAnswer out of range`);
  }

  return errs;
}

// ─── Module sequence validator ────────────────────────────────────────────────

export function validateModuleSequence(mod: CourseModule): LessonValidationError[] {
  const errs: LessonValidationError[] = [];
  const lessons = [...mod.lessons].sort((a, b) => a.order - b.order);
  if (lessons.length === 0) return errs;

  const seqErr = (slug: string, msg: string) =>
    errs.push(mkErr(mod.slug, slug, 'sequence', msg));

  // Checkpoint/exam cannot open a module
  if (['checkpoint', 'exam'].includes(lessons[0].type))
    seqErr(lessons[0].slug, `${lessons[0].type} cannot be the first lesson — students need content before a gate`);

  let hasContent = false;
  let prevType = '';

  for (const lesson of lessons) {
    // Practical must follow content
    if (['lab', 'assignment'].includes(lesson.type) && !hasContent)
      seqErr(lesson.slug, `${lesson.type} appears before any content lesson — add instruction first`);

    // No consecutive checkpoints
    if (lesson.type === 'checkpoint' && prevType === 'checkpoint')
      seqErr(lesson.slug, 'consecutive checkpoints — add content between them');

    if (CONTENT_LESSON_TYPES.includes(lesson.type as any) && lesson.type !== 'checkpoint')
      hasContent = true;
    prevType = lesson.type;
  }

  return errs;
}

// ─── Course-level validator ───────────────────────────────────────────────────

export function validateCourseTemplate(template: CourseTemplate): CourseValidationResult {
  const allErrors: LessonValidationError[] = [];
  const cErr = (field: string, msg: string, sev: 'error' | 'warning' = 'error') =>
    allErrors.push(mkErr('_course', '_course', field, msg, sev));

  // Program mapping
  if (!resolveCourseId(template.programSlug))
    cErr('programSlug', `'${template.programSlug}' not in PROGRAM_COURSE_MAP — add it to lib/course-builder/schema.ts`);

  // Identity
  if (!template.courseSlug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(template.courseSlug))
    cErr('courseSlug', 'must be lowercase kebab-case');
  if (!template.title || template.title.trim().length < 3)
    cErr('title', 'course title required');
  if (!template.modules?.length)
    cErr('modules', 'course must have at least one module');

  // Duplicate slugs
  const seen = new Set<string>();
  for (const mod of template.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      if (seen.has(lesson.slug))
        allErrors.push(mkErr(mod.slug, lesson.slug, 'slug', `duplicate slug '${lesson.slug}'`));
      seen.add(lesson.slug);
    }
  }

  // Per-lesson + per-module
  for (const mod of template.modules ?? []) {
    for (const lesson of mod.lessons ?? [])
      allErrors.push(...validateCourseLesson(lesson, mod.slug));
    allErrors.push(...validateModuleSequence(mod));
  }

  // Course-level completion rules
  const allLessons = (template.modules ?? [])
    .flatMap(m => [...m.lessons].sort((a, b) => a.order - b.order));

  const hasAssessed = allLessons.some(l => ASSESSED_LESSON_TYPES.includes(l.type as any));
  if (!hasAssessed)
    cErr('modules', 'course has no assessed lessons — students cannot demonstrate mastery', 'warning');

  // Exam must be last
  const exams = allLessons.filter(l => l.type === 'exam');
  if (exams.length > 0) {
    const last = allLessons[allLessons.length - 1];
    if (last?.type !== 'exam' && last?.type !== 'certification')
      allErrors.push(mkErr('_course', exams[0].slug, 'sequence',
        `exam '${exams[0].slug}' is not the last lesson — move it to the end`));
  }

  // requiresFinalExam enforcement
  if (template.requiresFinalExam && exams.length === 0)
    cErr('requiresFinalExam', 'requiresFinalExam=true but no exam lesson found');

  // Final exam must have passingScore
  if (exams.length > 0 && exams[0].passingScore == null)
    cErr('finalExam', `final exam '${exams[0].slug}' has no passingScore`);

  // Warn if course doesn't end on exam or certification
  const last = allLessons[allLessons.length - 1];
  if (last && !['exam', 'certification'].includes(last.type))
    cErr('sequence', `course ends on '${last.type}' — consider ending with an exam or certification step`, 'warning');

  // minimumHours check
  if (template.minimumHours) {
    const hoursResult = validateHours(template);
    if (!hoursResult.valid) {
      for (const e of hoursResult.errors) cErr('minimumHours', e);
    }
    for (const w of hoursResult.warnings) cErr('minimumHours', w, 'warning');
  }

  // Quiz-required module enforcement
  for (const mod of template.modules ?? []) {
    if (mod.quizRequired) {
      const hasAssessment = mod.lessons.some(l =>
        ASSESSED_LESSON_TYPES.includes(l.type as any)
      );
      if (!hasAssessment)
        allErrors.push(mkErr(mod.slug, '_module', 'quizRequired',
          `module '${mod.slug}' has quizRequired=true but no checkpoint/quiz/exam lesson`));
    }
    if (mod.practicalRequired) {
      const hasPractical = mod.lessons.some(l => l.type === 'lab' || l.type === 'assignment');
      if (!hasPractical)
        allErrors.push(mkErr(mod.slug, '_module', 'practicalRequired',
          `module '${mod.slug}' has practicalRequired=true but no lab/assignment lesson`));
    }
  }

  // Critical competency coverage
  const programCompetencies = getCompetenciesForProgram(template.programSlug);
  const criticalKeys = programCompetencies.filter(c => c.isCritical).map(c => c.key);
  if (criticalKeys.length > 0) {
    const coveredKeys = new Set(
      allLessons.flatMap(l => (l.competencyChecks ?? []).map(c => c.key))
    );
    const uncoveredCritical = criticalKeys.filter(k => !coveredKeys.has(k));
    for (const key of uncoveredCritical)
      cErr('competencyChecks', `critical competency '${key}' is not covered by any lesson`)
  }

  const errors   = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');
  const lessonCount = (template.modules ?? []).reduce((s, m) => s + (m.lessons?.length ?? 0), 0);

  return { valid: errors.length === 0, errors, warnings, lessonCount, errorCount: errors.length, warningCount: warnings.length };
}

// ─── Pre-publish gate ─────────────────────────────────────────────────────────

export function assertPublishable(template: CourseTemplate): void {
  const result = validateCourseTemplate(template);
  for (const w of result.warnings)
    console.warn(`[course-builder] WARNING ${w.moduleSlug}/${w.lessonSlug} [${w.field}]: ${w.message}`);
  if (!result.valid) {
    const lines = result.errors.map(e => `  ${e.moduleSlug}/${e.lessonSlug} [${e.field}]: ${e.message}`);
    throw new Error(`Course '${template.courseSlug}' failed validation (${result.errorCount} error(s)):\n${lines.join('\n')}`);
  }
}
