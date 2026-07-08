/**
 * buildCanonicalCourseFromBlueprint
 *
 * Canonical persistence layer for blueprint-driven course generation.
 *
 * Writes to: courses → course_modules → course_lessons
 * These are the tables lms_lessons reads from. Nothing else.
 *
 * Does NOT write to curriculum_lessons, curriculum_quizzes, curriculum_recaps,
 * training_lessons, or training_courses. Those are legacy paths.
 *
 * Idempotency:
 *   mode = 'replace'       — delete existing modules/lessons for this course, then insert fresh
 *   mode = 'missing-only'  — skip lessons whose slug already exists in course_lessons for this course
 *
 * The courses row itself is always upserted on (slug) so re-runs are safe.
 */

import { createAdminClient, requireAdminClient } from '@/lib/supabase/admin';
import type {
  CredentialBlueprint,
  BlueprintModule,
  BlueprintLessonRef,
  BlueprintVideoConfig,
} from '../blueprints/types';
import { logger } from '@/lib/logger';
import { defaultActivities } from '../activities';
import { loadIndustryStandards, type IndustryStandards } from '@/lib/industry/standards-loader';

// ─── curriculum_lessons row shape (fields we read) ───────────────────────────

type CurriculumRow = {
  lesson_slug: string;
  script_text: string | null;
  step_type: string | null;
  passing_score: number | null;
  quiz_questions: unknown | null;
  duration_minutes: number | null;
  video_file: string | null;
};

// ─── Production completeness contract ────────────────────────────────────────
//
// A lesson row is only inserted when it carries the full production payload
// required for its step_type. If any required field is absent, the lesson is
// skipped entirely — no draft shell, no placeholder row.
//
// Required fields by step_type:
//   lesson      — content (>200 visible chars) + objective
//   checkpoint  — content + objective + quizQuestions (≥5) + passingScore
//   quiz/exam   — quizQuestions (≥5) + passingScore
//   lab         — content + objective
//   assignment  — content + objective

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

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuildMode = 'replace' | 'missing-only';

export interface BuildCanonicalCourseInput {
  blueprint: CredentialBlueprint;
  programId: string;
  /** Stable slug for the courses row. Defaults to blueprint.programSlug. */
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
  /** Lessons that failed production-content validation — no row was created */
  contentFailures: LessonFailure[];
  warnings: string[];
}

function buildIndustryStandardsNote(
  standards: IndustryStandards,
  lessonRef: BlueprintLessonRef,
): string {
  const topTask = standards.top_tasks[0] ?? 'n/a';
  const topSkill = standards.top_skills[0] ?? 'n/a';
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
    `Top task signal: ${topTask}`,
    `Top skill signal: ${topSkill}`,
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
  const notes = [...(lessonRef.instructorNotes ?? [])];

  if (standards) {
    notes.push(buildIndustryStandardsNote(standards, lessonRef));
  }

  if (lessonRef.competencyChecks?.length) {
    notes.push(`Competency checks: ${lessonRef.competencyChecks.join('; ')}`);
  }

  return notes.length ? notes.join('\n\n') : null;
}

// ─── Preflight validator ──────────────────────────────────────────────────────

function validateLessons(modules: CredentialBlueprint['modules']): void {
  const slugs = new Set<string>();
  const orderKeys = new Set<string>(); // `${moduleOrderIndex}:${lessonOrder}`

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

      const stepType = inferStepType(lesson.slug);
      if (stepType === 'exam' && !lesson.slug.includes('practice')) {
        // Generated programs may use generic final-exam slugs (for example,
        // `prs-career-exam`). Keep a lightweight warning for auditing, but do
        // not hard-fail seeding on slug naming alone.
        const hasCode =
          lesson.slug.includes('qbocu') ||
          lesson.slug.includes('icbp') ||
          lesson.slug.includes('epa') ||
          lesson.slug.includes('certiport') ||
          lesson.slug.includes('indiana') ||
          lesson.slug.includes('state-board') ||
          lesson.slug.includes('nha') ||
          lesson.slug.includes('act-workkeys');
        if (!hasCode) {
          logger.warn(
            `[seeder] Exam lesson '${lesson.slug}' has a generic slug; continuing with seeding.`,
          );
        }
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function buildCanonicalCourseFromBlueprint(
  input: BuildCanonicalCourseInput,
): Promise<BuildCanonicalCourseResult> {
  const db = await requireAdminClient();
  const warnings: string[] = [];
  let industryStandards: IndustryStandards | null = null;

  const slug = input.courseSlug ?? input.blueprint.programSlug;
  const title = input.courseTitle ?? input.blueprint.credentialTitle;

  // ── 1. Upsert courses row ──────────────────────────────────────────────────
  const { data: existingCourse } = await db
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  let courseId: string;

  if (existingCourse?.id) {
    courseId = existingCourse.id;
    await db
      .from('courses')
      .update({
        title,
        program_id: input.programId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId);
  } else {
    const { data: newCourse, error: courseErr } = await db
      .from('courses')
      .insert({
        slug,
        title,
        program_id: input.programId,
        status: 'draft',
        is_active: true,
      })
      .select('id')
      .maybeSingle();

    if (courseErr || !newCourse) {
      throw new Error(
        `buildCanonicalCourseFromBlueprint: failed to create course — ${courseErr?.message}`,
      );
    }
    courseId = newCourse.id;
  }

  // ── 2. Preflight — validate before any destructive DB write ──────────────
  validateLessons(input.blueprint.modules);

  // ── 3. Replace mode: wipe existing modules + lessons ──────────────────────
  if (input.mode === 'replace') {
    // course_lessons has ON DELETE CASCADE from course_modules, but delete
    // lessons first to be explicit and avoid FK constraint races.
    await db.from('course_lessons').delete().eq('course_id', courseId);
    await db.from('course_modules').delete().eq('course_id', courseId);
  }

  // ── 4. Load existing lesson slugs for missing-only mode ───────────────────
  const existingSlugs = new Set<string>();
  if (input.mode === 'missing-only') {
    const { data: existing } = await db
      .from('course_lessons')
      .select('slug')
      .eq('course_id', courseId);
    for (const row of existing ?? []) {
      if (row.slug) existingSlugs.add(row.slug);
    }
  }

  // ── 4b. Pre-fetch curriculum_lessons content when contentSource = 'curriculum_lessons' ──
  // Bulk-fetch all matching rows up front to avoid N+1 queries in the lesson loop.
  const curriculumMap = new Map<string, CurriculumRow>();
  if (input.blueprint.contentSource === 'curriculum_lessons') {
    const allSlugs = input.blueprint.modules.flatMap((m) => (m.lessons ?? []).map((l) => l.slug));
    if (allSlugs.length > 0) {
      const { data: curRows, error: curErr } = await db
        .from('curriculum_lessons')
        .select(
          'lesson_slug, script_text, step_type, passing_score, quiz_questions, duration_minutes, video_file',
        )
        .in('lesson_slug', allSlugs);

      if (curErr) {
        warnings.push(
          `curriculum_lessons fetch failed: ${curErr.message} — lessons will have no content`,
        );
      } else {
        for (const row of curRows ?? []) {
          curriculumMap.set(row.lesson_slug, row as CurriculumRow);
        }
        logger.info(
          `[seeder] Loaded ${curriculumMap.size}/${allSlugs.length} rows from curriculum_lessons`,
        );
      }
    }
  }

  // ── 5. Upsert modules + lessons in blueprint order ────────────────────────
  if (input.blueprint.socCode) {
    try {
      industryStandards = await loadIndustryStandards(
        input.blueprint.socCode,
        input.blueprint.credentialCode ?? null,
      );
      if (!industryStandards) {
        warnings.push(
          `Industry standards unavailable for SOC ${input.blueprint.socCode} (O*NET/BLS not loaded)`,
        );
      }
    } catch (err) {
      warnings.push(
        `Industry standards load failed for SOC ${input.blueprint.socCode}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // ── 5. Upsert modules + lessons in blueprint order ────────────────────────
  let totalLessons = 0;
  let skipped = 0;
  const contentFailures: LessonFailure[] = [];

  const sortedModules = [...input.blueprint.modules].sort((a, b) => a.orderIndex - b.orderIndex);

  for (const mod of sortedModules) {
    const moduleId = await upsertModule(db, courseId, mod);
    if (!moduleId) {
      warnings.push(`Module '${mod.slug}' failed to upsert — skipping its lessons`);
      continue;
    }

    const lessons = mod.lessons ?? [];
    const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

    for (const lessonRef of sortedLessons) {
      if (input.mode === 'missing-only' && existingSlugs.has(lessonRef.slug)) {
        skipped++;
        continue;
      }

      if (input.blueprint.contentSource === 'curriculum_lessons') {
        // ── DB-sourced content path ────────────────────────────────────────
        // Content, step_type, quiz_questions, and passing_score all come from
        // curriculum_lessons. The production-content gate is skipped — the DB
        // is the authority. A missing curriculum row is a warning, not a failure.
        const curRow = curriculumMap.get(lessonRef.slug);
        if (!curRow) {
          warnings.push(
            `No curriculum_lessons row for slug '${lessonRef.slug}' — lesson inserted without content`,
          );
        }

        const ok = await upsertLessonFromCurriculum(
          db,
          courseId,
          moduleId,
          mod,
          lessonRef,
          curRow ?? null,
          input.blueprint.videoConfig,
          industryStandards,
        );
        if (ok) {
          totalLessons++;
        } else {
          warnings.push(`Lesson '${lessonRef.slug}' failed to upsert — see console for DB error`);
        }
      } else {
        // ── Blueprint-embedded content path (default) ──────────────────────
        // Production-content gate: a lesson row is only inserted when it carries
        // the full payload required for its step_type. No draft shells.
        const stepType = inferStepType(lessonRef.slug);
        const violations = validateProductionContent(lessonRef, stepType);

        if (violations.length > 0) {
          const failure: LessonFailure = {
            slug: lessonRef.slug,
            title: lessonRef.title,
            stepType,
            violations,
          };
          contentFailures.push(failure);
          logger.error(
            `[seeder] SKIP ${lessonRef.slug} (${stepType}) — missing production content:`,
            violations.map((v) => `${v.field}: ${v.reason}`).join(', '),
          );
          continue;
        }

        const ok = await upsertLesson(
          db,
          courseId,
          moduleId,
          mod,
          lessonRef,
          input.blueprint.videoConfig,
          industryStandards,
        );
        if (ok) {
          totalLessons++;
        } else {
          warnings.push(`Lesson '${lessonRef.slug}' failed to upsert — see console for DB error`);
        }
      }
    }
  }

  const result: BuildCanonicalCourseResult = {
    courseId,
    moduleCount: sortedModules.length,
    lessonCount: totalLessons,
    skipped,
    contentFailures,
    warnings,
  };

  // Audit the seed run — always logged regardless of failures so there is a
  // complete record of every time the seeder touched production.
  try {
    const { logAdminAudit, AdminAction } = await import('@/lib/admin/audit-log');
    await logAdminAudit({
      action: AdminAction.COURSE_SEED_RUN,
      // No human actor in CLI context. Use the nil UUID as sentinel so the
      // target_id UUID column constraint is satisfied.
      actorId: '00000000-0000-0000-0000-000000000000',
      entityType: 'courses',
      entityId: courseId,
      metadata: {
        blueprint_id: input.blueprint.id,
        blueprint_version: input.blueprint.version,
        mode: input.mode,
        lessons_inserted: totalLessons,
        lessons_skipped: skipped,
        content_failures: contentFailures.length,
        failed_slugs: contentFailures.map((f) => f.slug),
      },
    });
  } catch {
    // Audit failure must never crash the seeder
    logger.warn('[seeder] Audit log failed — seed result is still valid');
  }

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertModule(
  db: ReturnType<typeof createAdminClient>,
  courseId: string,
  mod: BlueprintModule,
): Promise<string | null> {
  // Try to find existing module by course_id + order_index
  const { data: existing } = await db
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId)
    .eq('order_index', mod.orderIndex)
    .maybeSingle();

  if (existing?.id) {
    await db
      .from('course_modules')
      .update({ title: mod.title, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data: newMod, error } = await db
    .from('course_modules')
    .insert({
      course_id: courseId,
      title: mod.title,
      order_index: mod.orderIndex,
    })
    .select('id')
    .maybeSingle();

  if (error || !newMod) return null;
  return newMod.id;
}

async function upsertLesson(
  db: ReturnType<typeof createAdminClient>,
  courseId: string,
  moduleId: string,
  mod: BlueprintModule,
  lessonRef: BlueprintLessonRef,
  videoConfig?: BlueprintVideoConfig,
  industryStandards?: IndustryStandards | null,
): Promise<boolean> {
  // order_index encoding: module * 1000 + lesson (matches course-service.ts convention)
  const orderIndex = mod.orderIndex * 1000 + lessonRef.order;
  const stepType = inferStepType(lessonRef.slug);
  const activities = defaultActivities(stepType);

  // Content payload — only fields present on the lesson ref are written.
  // validateProductionContent() already confirmed required fields exist before
  // this function is called, so these are safe to spread directly.
  const contentPayload: Record<string, unknown> = {};
  if (lessonRef.content) contentPayload.content = lessonRef.content;
  if (lessonRef.objective) contentPayload.scenario_prompt = lessonRef.objective;
  if (lessonRef.quizQuestions) contentPayload.quiz_questions = lessonRef.quizQuestions;
  if (lessonRef.passingScore != null) contentPayload.passing_score = lessonRef.passingScore;
  if (lessonRef.durationMinutes != null)
    contentPayload.duration_minutes = lessonRef.durationMinutes;
  if (lessonRef.partnerExamCode) contentPayload.partner_exam_code = lessonRef.partnerExamCode;
  const instructorNotes = mergeInstructorNotes(lessonRef, industryStandards ?? null);
  if (instructorNotes) contentPayload.instructor_notes = instructorNotes;

  const { data: existing } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', lessonRef.slug)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await db
      .from('course_lessons')
      .update({
        module_id: moduleId,
        title: lessonRef.title,
        lesson_type: stepType,
        order_index: orderIndex,
        activities,
        ...contentPayload,
        ...(videoConfig ? { video_config: videoConfig } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error)
      logger.error(`[seeder] DB update error [${lessonRef.slug}]:`, error.message, error.details);
    return !error;
  }

  const { error } = await db.from('course_lessons').insert({
    course_id: courseId,
    module_id: moduleId,
    slug: lessonRef.slug,
    title: lessonRef.title,
    lesson_type: stepType,
    order_index: orderIndex,
    is_required: true,
    is_published: true,
    status: 'published',
    activities,
    ...contentPayload,
    ...(videoConfig ? { video_config: videoConfig } : {}),
  });

  if (error)
    logger.error(`[seeder] DB insert error [${lessonRef.slug}]:`, {
      code: error.code,
      message: error.message,
      details: error.details,
    });
  return !error;
}

/**
 * Infer lesson_type from slug suffix.
 * Used for blueprint-embedded content path only.
 * For curriculum_lessons path, step_type is read directly from the DB row.
 */
export function inferStepType(slug: string): string {
  if (slug.endsWith('-checkpoint')) return 'checkpoint';
  if (slug.endsWith('-exam') || slug.endsWith('-practice-exam')) return 'exam';
  if (slug.endsWith('-quiz')) return 'quiz';
  if (slug.endsWith('-lab')) return 'lab';
  if (slug.endsWith('-assignment')) return 'assignment';
  if (slug.endsWith('-certification')) return 'certification';
  return 'lesson';
}

/**
 * Upsert a lesson whose content comes from a curriculum_lessons row.
 * step_type is read from cur.step_type (not inferred from slug suffix).
 * Content, quiz_questions, passing_score, and video_url are all DB-sourced.
 */
async function upsertLessonFromCurriculum(
  db: ReturnType<typeof createAdminClient>,
  courseId: string,
  moduleId: string,
  mod: BlueprintModule,
  lessonRef: BlueprintLessonRef,
  cur: CurriculumRow | null,
  videoConfig?: BlueprintVideoConfig,
  industryStandards?: IndustryStandards | null,
): Promise<boolean> {
  const orderIndex = mod.orderIndex * 1000 + lessonRef.order;

  // step_type: use DB value when available, fall back to slug-suffix inference
  const stepType = cur?.step_type ?? inferStepType(lessonRef.slug);
  const activities = defaultActivities(stepType);

  const payload: Record<string, unknown> = {
    course_id: courseId,
    module_id: moduleId,
    slug: lessonRef.slug,
    title: lessonRef.title,
    lesson_type: stepType,
    order_index: orderIndex,
    is_required: true,
    is_published: true,
    status: 'published',
    activities,
    ...(videoConfig ? { video_config: videoConfig } : {}),
  };

  const instructorNotes = mergeInstructorNotes(lessonRef, industryStandards ?? null);
  if (instructorNotes) payload.instructor_notes = instructorNotes;

  // Merge curriculum_lessons content when available
  if (cur) {
    if (cur.script_text) payload.content = cur.script_text;
    if (cur.quiz_questions) payload.quiz_questions = cur.quiz_questions;
    if (cur.passing_score) payload.passing_score = cur.passing_score;
    if (cur.duration_minutes) payload.duration_minutes = cur.duration_minutes;
    if (cur.video_file) payload.video_url = cur.video_file;
  }

  // Blueprint-level videoFile overrides video_url when no DB video_file is set
  if (lessonRef.videoFile && !payload.video_url) {
    payload.video_url = lessonRef.videoFile;
  }
  // Always store blueprint videoFile in video_config for runtime fallback
  if (lessonRef.videoFile) {
    payload.video_config = {
      ...((payload.video_config as object) ?? {}),
      videoFile: lessonRef.videoFile,
    };
  }

  const { data: existing } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', lessonRef.slug)
    .maybeSingle();

  if (existing?.id) {
    const { id: _, course_id: __, slug: ___, ...updateFields } = payload as Record<string, unknown>;
    const { error } = await db
      .from('course_lessons')
      .update({ ...updateFields, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) logger.error(`[seeder] DB update error [${lessonRef.slug}]:`, error.message);
    return !error;
  }

  const { error } = await db.from('course_lessons').insert(payload);
  if (error) logger.error(`[seeder] DB insert error [${lessonRef.slug}]:`, error.message);
  return !error;
}
