/**
 * Compatibility seeder for credential blueprints.
 *
 * Historical callers keep this API, including production-content checks,
 * curriculum_lessons hydration, industry-standards notes, and seed auditing.
 * Complete package persistence is owned by lib/course-factory/publisher.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { defaultActivities } from '../activities';
import { buildLearningExperience } from '../learning-experience';
import { loadIndustryStandards, type IndustryStandards } from '@/lib/industry/standards-loader';
import { publishCourse, publishCourseAtomic } from '@/lib/course-factory/publisher';
import type {
  CredentialBlueprint,
  BlueprintModule,
  BlueprintLessonRef,
  BlueprintQuizQuestion,
} from '../blueprints/types';

type CurriculumRow = {
  lesson_slug: string;
  script_text: string | null;
  step_type: string | null;
  passing_score: number | null;
  quiz_questions: unknown | null;
  duration_minutes: number | null;
  video_file: string | null;
};

export type ContentViolation = { field: string; reason: string };

export function visibleTextLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').trim().length;
}

export function validateProductionContent(
  lessonRef: BlueprintLessonRef,
  stepType: string,
): ContentViolation[] {
  const violations: ContentViolation[] = [];
  const needsContent = ['lesson', 'checkpoint', 'lab', 'assignment'].includes(stepType);
  const needsQuiz = ['checkpoint', 'quiz', 'exam'].includes(stepType);
  const needsObjective = ['lesson', 'checkpoint', 'lab', 'assignment'].includes(stepType);

  if (needsObjective && !lessonRef.objective?.trim()) {
    violations.push({ field: 'objective', reason: 'missing' });
  }

  if (needsContent) {
    if (!lessonRef.content) {
      violations.push({ field: 'content', reason: 'missing' });
    } else if (visibleTextLength(lessonRef.content) < 200) {
      violations.push({
        field: 'content',
        reason: `too short — ${visibleTextLength(lessonRef.content)} visible chars, need ≥200`,
      });
    }
  }

  if (needsQuiz) {
    if (!lessonRef.quizQuestions || lessonRef.quizQuestions.length === 0) {
      violations.push({ field: 'quizQuestions', reason: 'missing' });
    } else if (lessonRef.quizQuestions.length < 5) {
      violations.push({
        field: 'quizQuestions',
        reason: `only ${lessonRef.quizQuestions.length} questions, need ≥5`,
      });
    }
    if (lessonRef.passingScore == null) {
      violations.push({ field: 'passingScore', reason: 'missing' });
    } else if (lessonRef.passingScore < 1 || lessonRef.passingScore > 100) {
      violations.push({
        field: 'passingScore',
        reason: `value ${lessonRef.passingScore} out of range (1–100)`,
      });
    }
  }

  return violations;
}

export type BuildMode = 'replace' | 'missing-only';

export interface BuildCanonicalCourseInput {
  blueprint: CredentialBlueprint;
  programId: string;
  courseSlug?: string;
  courseTitle?: string;
  mode: BuildMode;
}

export interface LessonFailure {
  slug: string;
  title: string;
  stepType: string;
  violations: { field: string; reason: string }[];
}

export interface BuildCanonicalCourseResult {
  courseId: string;
  moduleCount: number;
  lessonCount: number;
  skipped: number;
  contentFailures: LessonFailure[];
  warnings: string[];
}

export function inferStepType(slug: string): string {
  if (slug.endsWith('-checkpoint')) return 'checkpoint';
  if (slug.endsWith('-exam') || slug.endsWith('-practice-exam')) return 'exam';
  if (slug.endsWith('-quiz')) return 'quiz';
  if (slug.endsWith('-lab')) return 'lab';
  if (slug.endsWith('-assignment')) return 'assignment';
  if (slug.endsWith('-certification')) return 'certification';
  return 'lesson';
}

function validateLessons(modules: CredentialBlueprint['modules']): void {
  const slugs = new Set<string>();
  const orderKeys = new Set<string>();
  for (const mod of modules) {
    for (const lesson of mod.lessons ?? []) {
      if (!lesson.slug)
        throw new Error(`Missing slug in module '${mod.slug}' at order ${lesson.order}`);
      if (slugs.has(lesson.slug)) throw new Error(`Duplicate slug: ${lesson.slug}`);
      slugs.add(lesson.slug);
      const key = `${mod.orderIndex}:${lesson.order}`;
      if (orderKeys.has(key))
        throw new Error(`Duplicate order ${lesson.order} in module '${mod.slug}'`);
      orderKeys.add(key);
    }
  }
}

function buildIndustryStandardsNote(
  standards: IndustryStandards,
  lessonRef: BlueprintLessonRef,
): string {
  const median = standards.median_annual_wage
    ? `$${standards.median_annual_wage.toLocaleString()}`
    : 'n/a';
  const growth =
    standards.projected_growth_pct != null
      ? `${standards.projected_growth_pct}% (${standards.projected_growth_cat ?? 'unknown'})`
      : 'n/a';
  return [
    '[Industry Standards Context]',
    `SOC: ${standards.soc_code} - ${standards.occupation_title || 'Occupation'}`,
    `Top task signal: ${standards.top_tasks[0] ?? 'n/a'}`,
    `Top skill signal: ${standards.top_skills[0] ?? 'n/a'}`,
    `Median wage: ${median}`,
    `Growth outlook: ${growth}`,
    `Sources: ${standards.sources.join(', ')}`,
    `Lesson slug: ${lessonRef.slug}`,
  ].join('\n');
}

function mergeInstructorNotes(
  lessonRef: BlueprintLessonRef,
  standards: IndustryStandards | null,
): string | null {
  const raw = lessonRef.instructorNotes;
  const notes = Array.isArray(raw) ? [...raw] : raw ? [raw] : [];
  if (standards) notes.push(buildIndustryStandardsNote(standards, lessonRef));
  if (lessonRef.competencyChecks?.length) {
    notes.push(
      `Competency checks: ${lessonRef.competencyChecks
        .map((check) => (typeof check === 'string' ? check : (check.label ?? check.key)))
        .join('; ')}`,
    );
  }
  return notes.length ? notes.join('\n\n') : null;
}

function normalizeQuizQuestions(raw: unknown, slug: string): BlueprintQuizQuestion[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const normalized: BlueprintQuizQuestion[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;
    const q = entry as Record<string, any>;
    const options = Array.isArray(q.options) ? q.options.map(String) : [];
    const question = String(q.question ?? q.question_text ?? '').trim();
    if (!question || options.length === 0) return;
    let correctAnswer = Number.isInteger(q.correctAnswer)
      ? Number(q.correctAnswer)
      : Number.isInteger(q.correct)
        ? Number(q.correct)
        : options.indexOf(String(q.correct_answer ?? ''));
    if (correctAnswer < 0) correctAnswer = 0;
    normalized.push({
      id: String(q.id ?? `${slug}-q${index + 1}`),
      question,
      options,
      correctAnswer,
      explanation: q.explanation ? String(q.explanation) : undefined,
    });
  });
  return normalized.length ? normalized : undefined;
}

async function prepareBlueprint(blueprint: CredentialBlueprint): Promise<{
  modules: BlueprintModule[];
  contentFailures: LessonFailure[];
  warnings: string[];
}> {
  validateLessons(blueprint.modules);
  const db = await requireAdminClient();
  const warnings: string[] = [];
  const contentFailures: LessonFailure[] = [];
  const curriculumMap = new Map<string, CurriculumRow>();

  if (blueprint.contentSource === 'curriculum_lessons') {
    const slugs = blueprint.modules.flatMap((mod) =>
      (mod.lessons ?? []).map((lesson) => lesson.slug),
    );
    if (slugs.length) {
      const { data, error } = await db
        .from('curriculum_lessons')
        .select(
          'lesson_slug, script_text, step_type, passing_score, quiz_questions, duration_minutes, video_file',
        )
        .in('lesson_slug', slugs);
      if (error) warnings.push(`curriculum_lessons fetch failed: ${error.message}`);
      for (const row of data ?? []) {
        if (row.lesson_slug) curriculumMap.set(row.lesson_slug, row as CurriculumRow);
      }
    }
  }

  let standards: IndustryStandards | null = null;
  const socCode = typeof blueprint.socCode === 'string' ? blueprint.socCode : undefined;
  if (socCode) {
    try {
      standards = await loadIndustryStandards(socCode, blueprint.credentialCode ?? null);
      if (!standards) warnings.push(`Industry standards unavailable for SOC ${socCode}`);
    } catch (error) {
      warnings.push(
        `Industry standards load failed for SOC ${socCode}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const modules = blueprint.modules.map((mod) => {
    const lessons: BlueprintLessonRef[] = [];
    for (const original of mod.lessons ?? []) {
      const lesson: BlueprintLessonRef = { ...original };
      const extra = lesson as BlueprintLessonRef & Record<string, any>;
      const cur = curriculumMap.get(lesson.slug);

      if (blueprint.contentSource === 'curriculum_lessons') {
        if (!cur) warnings.push(`No curriculum_lessons row for slug '${lesson.slug}'`);
        if (cur?.script_text) lesson.content = cur.script_text;
        if (cur?.passing_score != null) lesson.passingScore = cur.passing_score;
        if (cur?.duration_minutes != null) lesson.durationMinutes = cur.duration_minutes;
        if (cur?.video_file) lesson.videoFile = cur.video_file;
        const questions = normalizeQuizQuestions(cur?.quiz_questions, lesson.slug);
        if (questions) lesson.quizQuestions = questions;
        if (cur?.step_type) extra.lessonType = cur.step_type;
      } else {
        const stepType = inferStepType(lesson.slug);
        const violations = validateProductionContent(lesson, stepType);
        if (violations.length) {
          contentFailures.push({
            slug: lesson.slug,
            title: lesson.title,
            stepType,
            violations,
          });
          continue;
        }
        extra.lessonType = stepType;
      }

      extra.activities = defaultActivities(String(extra.lessonType ?? inferStepType(lesson.slug)));
      extra.aiGenerated = true;
      extra.learningExperience = buildLearningExperience({
        lessonType: String(extra.lessonType ?? inferStepType(lesson.slug)),
        practicalRequired: Boolean(mod.practicalRequired || extra.practicalRequired),
      });
      extra.videoConfig = blueprint.videoConfig ?? extra.videoConfig;
      const notes = mergeInstructorNotes(lesson, standards);
      if (notes) lesson.instructorNotes = notes;
      lessons.push(lesson);
    }
    return { ...mod, lessons };
  });

  return { modules, contentFailures, warnings };
}

export async function buildCanonicalCourseFromBlueprint(
  input: BuildCanonicalCourseInput,
): Promise<BuildCanonicalCourseResult> {
  const prepared = await prepareBlueprint(input.blueprint);
  const courseSlug = input.courseSlug ?? input.blueprint.programSlug;
  const courseTitle = input.courseTitle ?? input.blueprint.credentialTitle;

  const persisted = await publishCourse({
    programId: input.programId,
    courseSlug,
    courseTitle,
    blueprint: prepared.modules,
    mode: input.mode,
    contentSource:
      input.blueprint.contentSource === 'curriculum_lessons' ? 'curriculum_lessons' : 'blueprint',
    videoConfig: { enabled: Boolean(input.blueprint.videoConfig) },
  });

  if (!persisted.success || !persisted.courseId) {
    throw new Error(
      `Course Factory persistence failed: ${persisted.errors.join('; ') || 'unknown error'}`,
    );
  }

  // Preserve historical seeder visibility behavior through the canonical publish RPC.
  const published = await publishCourseAtomic(persisted.courseId, input.programId);
  if (!published.success) {
    prepared.warnings.push(`Course staged but publish failed: ${published.error}`);
  }

  const result: BuildCanonicalCourseResult = {
    courseId: persisted.courseId,
    moduleCount: persisted.moduleCount,
    lessonCount: persisted.lessonCount,
    skipped: persisted.skippedCount,
    contentFailures: prepared.contentFailures,
    warnings: [...prepared.warnings, ...persisted.warnings],
  };

  try {
    const { logAdminAudit, AdminAction } = await import('@/lib/admin/audit-log');
    await logAdminAudit({
      action: AdminAction.COURSE_SEED_RUN,
      actorId: '00000000-0000-0000-0000-000000000000',
      entityType: 'courses',
      entityId: persisted.courseId,
      metadata: {
        blueprint_id: input.blueprint.id,
        blueprint_version: input.blueprint.version,
        mode: input.mode,
        lessons_inserted: persisted.lessonCount,
        lessons_skipped: persisted.skippedCount,
        content_failures: prepared.contentFailures.length,
        failed_slugs: prepared.contentFailures.map((failure) => failure.slug),
      },
    });
  } catch {
    logger.warn('[seeder] Audit log failed — seed result is still valid');
  }

  return result;
}
