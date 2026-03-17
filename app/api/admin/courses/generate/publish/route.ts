/**
 * POST /api/admin/courses/generate/publish
 *
 * Writes a reviewed course draft into production tables.
 * Accepts two body shapes:
 *   { course, program_id?, is_published? }  — legacy GeneratedCourse from /generate
 *   { draft, program_id?, is_published? }   — compiled draft from v2 course compiler
 *
 * Insert order: training_courses → training_lessons → curriculum_lessons (parallel, if program_id) → completion_rules → program_courses
 *
 * NOTE: HVAC (program 4226f7f6 / course f0593164) remains legacy-driven.
 * The live learner path is training_lessons (95 rows). The curriculum_lessons
 * skeleton (47 rows) is unpopulated and must NOT be published as the live
 * course until a full content parity migration is completed and verified.
 * Pass threshold: legacy quizzes use 70% (matching real EPA 608 exam).
 * curriculum_lessons checkpoints are set to 80% — resolve before activating.
 *
 * Schema verified against live DB (cuxzzpsyufcewtmicszk):
 *   completion_rules  — entity_type/entity_id (no direct course_id column)
 *   program_courses   — order_index (not sort_order)
 *   training_courses  — created_by, certificate_enabled, summary present
 *   training_lessons  — narration_script not a column; stored in metadata
 *
 * Returns { ok: true, courseId, lessonCount }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { runAlignmentAudit } from '@/lib/services/credential-alignment-audit';
import { slugify } from '@/lib/course-utils';
import type { GeneratedCourse } from '../route';

// ── Compiled draft schema (v2 course compiler) ────────────────────────────────

const QuizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correct_answer: z.string().min(1),
  explanation: z.string().min(1),
});

const SlideSectionSchema = z.object({
  slide_number: z.number().int().positive(),
  title: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1),
  speaker_notes: z.string().min(1),
  visual_suggestion: z.string().optional(),
});

const CompiledLessonSchema = z.object({
  lesson_title: z.string().min(1),
  lesson_objectives: z.array(z.string().min(1)).min(1),
  estimated_minutes: z.number().int().min(1),
  narration_script: z.string().min(1),
  /** 1–3 sentence learner-facing summary for preview and audit scoring */
  summary_text: z.string().default(''),
  /** Open-ended reflection question at end of lesson */
  reflection_prompt: z.string().default(''),
  /**
   * Competency keys this lesson covers. Max 3 — more than 3 triggers stuffing penalty.
   * Must match keys in competency_exam_profiles.
   */
  competency_keys: z.array(z.string().min(1)).max(3).default([]),
  slide_outline: z.array(SlideSectionSchema).min(1),
  practice_exercise: z.object({
    title: z.string().min(1),
    instructions: z.string().min(1),
    expected_outcome: z.string().min(1),
  }),
  knowledge_check: z.array(QuizQuestionSchema).min(1),
  instructor_notes: z.array(z.string().min(1)).min(1),
});

const CompiledModuleSchema = z.object({
  module_title: z.string().min(1),
  module_order: z.number().int().positive(),
  module_objectives: z.array(z.string().min(1)).min(1),
  lessons: z.array(CompiledLessonSchema).min(1),
});

const PublishDraftSchema = z.object({
  course_title: z.string().min(1),
  course_name: z.string().min(1),
  description: z.string().default(''),
  summary: z.string().default(''),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  learning_objectives: z.array(z.string().min(1)).min(1),
  target_audience: z.array(z.string().min(1)).default([]),
  estimated_total_minutes: z.number().int().min(1),
  certificate_enabled: z.boolean().default(true),
  completion_rule: z.object({
    type: z.enum(['lesson_completion', 'quiz_threshold', 'hybrid', 'all_lessons', 'required_lessons']),
    quiz_threshold_percent: z.number().int().min(0).max(100).optional(),
  }),
  modules: z.array(CompiledModuleSchema).min(1),
  source_type: z.string().optional(),
  source_prompt: z.string().optional(),
  program_id: z.string().uuid().optional(),
  auto_publish: z.boolean().default(false),
});

type PublishDraft = z.infer<typeof PublishDraftSchema>;
type CompiledLesson = z.infer<typeof CompiledLessonSchema>;
type CompiledModule = z.infer<typeof CompiledModuleSchema>;

// ── Publish status resolver ───────────────────────────────────────────────────

/**
 * Determines the correct status string for a course or lesson row.
 *
 * Rules:
 *   - wantsLive=false → always 'draft' (caller is staging, not publishing)
 *   - wantsLive=true + admin/super_admin/staff → 'published' (trusted roles)
 *   - wantsLive=true + any other role → 'pending_review' (requires human approval)
 *
 * This is the single place that enforces the review workflow. All status
 * assignments in the publish path must go through this function.
 */
const TRUSTED_PUBLISH_ROLES = new Set(['admin', 'super_admin', 'staff']);

function resolvePublishStatus(
  wantsLive: boolean,
  callerRole: string | null | undefined
): 'draft' | 'pending_review' | 'published' {
  if (!wantsLive) return 'draft';
  if (callerRole && TRUSTED_PUBLISH_ROLES.has(callerRole)) return 'published';
  return 'pending_review';
}

// ── Coverage gate ─────────────────────────────────────────────────────────────

/**
 * Blocks publication when the program's credential coverage audit fails.
 *
 * Only runs when:
 *   - a program_id is present (course is being attached to a program)
 *   - the caller is requesting live publication (not saving as draft)
 *
 * Returns an error message string if blocked, null if clear to publish.
 *
 * The audit checks: credential mapped, exam domains seeded, every domain
 * has at least one lesson with a quiz, completion rules exist.
 * Saving as draft (auto_publish=false / is_published=false) is always allowed
 * so admins can stage content before it is complete.
 */
async function checkCoverageGate(
  programId: string,
  isLivePublish: boolean
): Promise<string | null> {
  if (!isLivePublish) return null; // drafts bypass the gate

  // runAlignmentAudit takes slugs; resolve the program slug from the DB
  const db = createAdminClient();
  if (!db) {
    // DB client unavailable — infrastructure failure, fail open
    logger.error('coverage-gate: DB client unavailable, skipping audit', { programId });
    return null;
  }

  const { data: prog, error: progErr } = await db
    .from('programs')
    .select('slug')
    .eq('id', programId)
    .single();

  if (progErr) {
    // Network/DB error — infrastructure failure, fail open and log
    logger.error('coverage-gate: program lookup failed, skipping audit', {
      programId,
      error: progErr.message,
      code: progErr.code,
    });
    return null;
  }

  if (!prog) {
    // Row not found — data integrity problem, fail closed
    return (
      `Publication blocked: program "${programId}" not found. ` +
      `Verify the program_id is correct before publishing.`
    );
  }

  const result = await runAlignmentAudit([prog.slug]);
  const programAudit = result.programs.find(p => p.programSlug === prog.slug);

  if (!programAudit) {
    // Program exists but is not active — data integrity problem, fail closed
    return (
      `Publication blocked: program "${prog.slug}" is not active or has no credential mapping. ` +
      `Activate the program and map a primary credential before publishing.`
    );
  }

  if (programAudit.isAligned) return null; // all clear

  const gapSummary = programAudit.gaps.slice(0, 3).join('; ');
  return (
    `Publication blocked: credential coverage incomplete for program "${prog.slug}". ` +
    `Gaps: ${gapSummary}. ` +
    `Save as draft (auto_publish: false) to stage content without publishing.`
  );
}

// ── Pre-publish validators ────────────────────────────────────────────────────

function ensureUniqueLessonTitles(draft: PublishDraft): void {
  const seen = new Set<string>();
  for (const mod of draft.modules) {
    for (const lesson of mod.lessons) {
      const key = lesson.lesson_title.trim().toLowerCase();
      if (seen.has(key)) throw new Error(`Duplicate lesson title: "${lesson.lesson_title}"`);
      seen.add(key);
    }
  }
}

function validateQuizAnswers(draft: PublishDraft): void {
  for (const mod of draft.modules) {
    for (const lesson of mod.lessons) {
      for (const q of lesson.knowledge_check) {
        if (!q.options.includes(q.correct_answer)) {
          throw new Error(
            `Quiz answer mismatch in "${lesson.lesson_title}": ` +
            `"${q.correct_answer}" not found in options`
          );
        }
      }
    }
  }
}

function validateDurations(draft: PublishDraft): void {
  for (const mod of draft.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.estimated_minutes < 3)
        throw new Error(`Lesson too short: "${lesson.lesson_title}" (${lesson.estimated_minutes} min)`);
      if (lesson.narration_script.trim().length < 400)
        throw new Error(`Narration too short: "${lesson.lesson_title}" (${lesson.narration_script.trim().length} chars)`);
    }
  }
}

// ── Compiled draft content renderer ──────────────────────────────────────────

function renderCompiledLessonContent(lesson: CompiledLesson): string {
  const slides = lesson.slide_outline
    .map((slide) => {
      const bullets = slide.bullets.map((b) => `- ${b}`).join('\n');
      const parts = [
        `## Slide ${slide.slide_number}: ${slide.title}`,
        bullets,
        '',
        `**Speaker Notes**`,
        slide.speaker_notes,
      ];
      if (slide.visual_suggestion) parts.push('', `*Visual: ${slide.visual_suggestion}*`);
      return parts.join('\n');
    })
    .join('\n\n');

  const quiz = lesson.knowledge_check
    .map((q, idx) =>
      [
        `### Question ${idx + 1}`,
        q.question,
        q.options.map((o) => `- ${o}`).join('\n'),
        '',
        `**Correct Answer:** ${q.correct_answer}`,
        '',
        `**Explanation:** ${q.explanation}`,
      ].join('\n')
    )
    .join('\n\n');

  return [
    `# ${lesson.lesson_title}`,
    '',
    `## Learning Objectives`,
    ...lesson.lesson_objectives.map((o) => `- ${o}`),
    '',
    `## Narration Script`,
    lesson.narration_script.trim(),
    '',
    `## Slide Outline`,
    slides,
    '',
    `## Practice Exercise`,
    `**${lesson.practice_exercise.title}**`,
    '',
    lesson.practice_exercise.instructions,
    '',
    `**Expected Outcome:** ${lesson.practice_exercise.expected_outcome}`,
    '',
    `## Knowledge Check`,
    quiz,
  ].join('\n');
}

// ── Compiled draft publish path ───────────────────────────────────────────────

async function publishCompiledDraft(
  draft: PublishDraft,
  userId: string,
  callerRole: string | null | undefined,
  db: ReturnType<typeof createAdminClient>
): Promise<{ courseId: string; slug: string; lessonCount: number }> {
  ensureUniqueLessonTitles(draft);
  validateQuizAnswers(draft);
  validateDurations(draft);

  // Coverage gate: block live publication if credential alignment is incomplete.
  // Drafts (auto_publish: false) are always allowed through.
  if (draft.program_id) {
    const coverageError = await checkCoverageGate(draft.program_id, draft.auto_publish);
    if (coverageError) throw new Error(coverageError);
  }

  const slugBase = draft.course_name
    .toLowerCase().trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 74);
  const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;
  const durationHours = Number((draft.estimated_total_minutes / 60).toFixed(1));
  const passingScore = draft.completion_rule.quiz_threshold_percent ?? 70;

  // 1. training_courses
  const { data: courseRow, error: courseErr } = await db
    .from('training_courses')
    .insert({
      course_name:         draft.course_name,
      title:               draft.course_title,
      description:         draft.description,
      summary:             draft.summary,
      difficulty:          draft.difficulty,
      duration_hours:      durationHours,
      slug,
      is_published:        draft.auto_publish && TRUSTED_PUBLISH_ROLES.has(callerRole ?? ''),
      is_active:           draft.auto_publish && TRUSTED_PUBLISH_ROLES.has(callerRole ?? ''),
      status:              resolvePublishStatus(draft.auto_publish, callerRole),
      passing_score:       passingScore,
      certificate_enabled: draft.certificate_enabled,
      created_by:          userId,
      metadata: {
        ai_generated:           true,
        generation_version:     'v2-course-compiler',
        source_type:            draft.source_type ?? 'unknown',
        source_prompt:          draft.source_prompt ?? null,
        target_audience:        draft.target_audience,
        learning_objectives:    draft.learning_objectives,
        estimated_total_minutes: draft.estimated_total_minutes,
        module_count:           draft.modules.length,
        lesson_count:           draft.modules.reduce((s, m) => s + m.lessons.length, 0),
      },
    })
    .select('id, slug')
    .single();

  if (courseErr || !courseRow)
    throw new Error(`training_courses insert: ${courseErr?.message ?? 'no row returned'}`);

  const courseId = courseRow.id;

  // 2. training_lessons
  let lessonNumber = 1;
  const lessonRows: Record<string, unknown>[] = [];

  for (const mod of draft.modules) {
    for (const lesson of mod.lessons) {
      lessonRows.push({
        course_id:        courseId,
        lesson_number:    lessonNumber,
        title:            lesson.lesson_title,
        description:      lesson.lesson_objectives[0] ?? '',
        content:          renderCompiledLessonContent(lesson),
        content_type:     'text',
        duration_minutes: lesson.estimated_minutes,
        is_required:      true,
        is_published:     draft.auto_publish && TRUSTED_PUBLISH_ROLES.has(callerRole ?? ''),
        order_index:      lessonNumber - 1,
        quiz_questions:   lesson.knowledge_check,
        metadata: {
          ai_generated:      true,
          module_title:      mod.module_title,
          module_order:      mod.module_order,
          module_objectives: mod.module_objectives,
          lesson_objectives: lesson.lesson_objectives,
          narration_script:  lesson.narration_script,
          slide_outline:     lesson.slide_outline,
          practice_exercise: lesson.practice_exercise,
          instructor_notes:  lesson.instructor_notes,
          estimated_minutes: lesson.estimated_minutes,
        },
      });
      lessonNumber++;
    }
  }

  const { error: lessonsErr } = await db.from('training_lessons').insert(lessonRows);
  if (lessonsErr) throw new Error(`training_lessons insert: ${lessonsErr.message}`);

  // 2b. curriculum_lessons — parallel write so lms_lessons view serves these rows with priority.
  // Only written when program_id is present (NOT NULL constraint on curriculum_lessons).
  // The lms_lessons view returns curriculum_lessons rows first; training_lessons are the fallback.
  if (draft.program_id) {
    // Upsert modules rows so curriculum_lessons.module_id can be populated.
    // Identity key: program_id + slug. Safe to run on every publish.
    const moduleUpsertRows = draft.modules.map((mod) => ({
      program_id:  draft.program_id,
      title:       mod.module_title,
      slug:        slugify(mod.module_title).slice(0, 80),
      order_index: mod.module_order - 1,
    }));
    const { data: upsertedModules, error: modErr } = await db
      .from('modules')
      .upsert(moduleUpsertRows, { onConflict: 'program_id,slug', ignoreDuplicates: false })
      .select('id, slug');
    if (modErr) logger.warn('modules upsert failed (non-fatal)', { error: modErr.message });

    // Build slug → id map for module_id resolution below
    const moduleIdBySlug = new Map<string, string>(
      (upsertedModules ?? []).map((m: { id: string; slug: string }) => [m.slug, m.id])
    );

    let clLessonNumber = 1;
    const curriculumRows: Record<string, unknown>[] = [];

    // Track lesson count per module to auto-assign the last lesson as checkpoint.
    const moduleLessonCounts = new Map<number, number>();
    for (const mod of draft.modules) {
      moduleLessonCounts.set(mod.module_order, mod.lessons.length);
    }

    const moduleLessonIndexes = new Map<number, number>(); // module_order → current index (1-based)

    for (const mod of draft.modules) {
      const totalInModule = moduleLessonCounts.get(mod.module_order) ?? 0;
      moduleLessonIndexes.set(mod.module_order, 0);

      for (const lesson of mod.lessons) {
        const currentIndex = (moduleLessonIndexes.get(mod.module_order) ?? 0) + 1;
        moduleLessonIndexes.set(mod.module_order, currentIndex);

        const lessonSlug = `${slugify(lesson.lesson_title).slice(0, 80)}-${clLessonNumber}`;

        const keyTerms: Array<{ term: string; definition: string }> = [];

        // Derive step_type from content signals.
        // The last lesson of each module (except the final module) becomes a
        // checkpoint — it gates entry to the next module once the migration
        // 20260327000001_step_type.sql is applied.
        const titleLower = lesson.lesson_title.toLowerCase();
        const isLastInModule = currentIndex === totalInModule;
        const isFinalModule  = mod.module_order === draft.modules.length;
        const isCheckpoint   =
          titleLower.includes('checkpoint') ||
          titleLower.includes('module assessment') ||
          (isLastInModule && !isFinalModule);

        const step_type: string =
          isCheckpoint                                    ? 'checkpoint' :
          titleLower.includes('exam') ||
          titleLower.includes('final assessment')         ? 'exam' :
          titleLower.includes('lab') ||
          titleLower.includes('hands-on')                 ? 'lab' :
          titleLower.includes('assignment') ||
          titleLower.includes('reflection')               ? 'assignment' :
          lesson.knowledge_check?.length > 0              ? 'quiz' :
                                                            'lesson';

        const modSlug = slugify(mod.module_title).slice(0, 80);
        const resolvedModuleId = moduleIdBySlug.get(modSlug) ?? null;

        curriculumRows.push({
          program_id:        draft.program_id,
          course_id:         courseId,
          module_id:         resolvedModuleId,
          lesson_slug:       lessonSlug,
          lesson_title:      lesson.lesson_title,
          lesson_order:      clLessonNumber - 1,
          module_order:      mod.module_order - 1,
          module_title:      mod.module_title,
          step_type,
          passing_score:     isCheckpoint ? 80 : 0,
          script_text:       lesson.narration_script,
          summary_text:      lesson.summary_text || '',
          reflection_prompt: lesson.reflection_prompt || '',
          competency_keys:   lesson.competency_keys ?? [],
          key_terms:         keyTerms,
          duration_minutes:  lesson.estimated_minutes,
          status:            resolvePublishStatus(draft.auto_publish, callerRole),
        });
        clLessonNumber++;
      }
    }

    const { error: clErr } = await db.from('curriculum_lessons').insert(curriculumRows);
    if (clErr) {
      // Non-fatal: training_lessons already written. Log and continue.
      logger.warn('curriculum_lessons parallel write failed (non-fatal)', {
        courseId,
        programId: draft.program_id,
        error: clErr.message,
      });
    } else {
      logger.info('curriculum_lessons parallel write succeeded', {
        courseId,
        programId: draft.program_id,
        count: curriculumRows.length,
      });
    }
  }

  // 3. completion_rules — entity_type/entity_id pattern (no direct course_id column)
  const { error: ruleErr } = await db.from('completion_rules').insert({
    entity_type: 'course',
    entity_id:   courseId,
    rule_type:   draft.completion_rule.type,
    config: {
      quiz_threshold_percent: draft.completion_rule.quiz_threshold_percent ?? null,
      certificate_enabled:    draft.certificate_enabled,
      passing_score:          passingScore,
      ai_generated:           true,
    },
    is_active: true,
  });
  if (ruleErr) logger.warn('completion_rules insert failed (non-fatal)', { courseId, error: ruleErr.message });

  // 4. program_courses — order_index column (not sort_order)
  if (draft.program_id) {
    const { error: pcErr } = await db
      .from('program_courses')
      .upsert(
        { program_id: draft.program_id, course_id: courseId, is_required: true, order_index: 999 },
        { onConflict: 'program_id,course_id', ignoreDuplicates: true }
      );
    if (pcErr) logger.warn('program_courses upsert failed (non-fatal)', { courseId, error: pcErr.message });
  }

  return { courseId, slug: courseRow.slug, lessonCount: lessonRows.length };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function _POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = createAdminClient();

    const callerRole = user.profile?.role ?? null;

    // ── v2 compiled draft path ──────────────────────────────────────────────
    if (body.draft) {
      const parsed = PublishDraftSchema.safeParse(body.draft);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        return NextResponse.json({ error: `Invalid draft: ${issues}` }, { status: 422 });
      }
      const result = await publishCompiledDraft(parsed.data, user.id, callerRole, db);
      const finalStatus = resolvePublishStatus(parsed.data.auto_publish, callerRole);
      logger.info('AI course published (v2)', { userId: user.id, status: finalStatus, ...result });
      return NextResponse.json({ ok: true, status: finalStatus, ...result });
    }

    // ── Legacy GeneratedCourse path ─────────────────────────────────────────
    const { course, program_id, is_published = false }
      : { course: GeneratedCourse; program_id?: string; is_published?: boolean } = body;

    if (!course?.title || !course.modules?.length) {
      return NextResponse.json({ error: 'Invalid course data' }, { status: 400 });
    }

    // Coverage gate for legacy path
    if (program_id) {
      const coverageError = await checkCoverageGate(program_id, is_published);
      if (coverageError) {
        return NextResponse.json({ error: coverageError }, { status: 422 });
      }
    }

    // ── 1. Course record ────────────────────────────────────────────────────
    // slug with timestamp suffix prevents collisions on repeated generation
    const slugBase = course.title
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 74);
    const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;

    const durationHours = course.duration_hours ||
      Math.ceil(
        course.modules.reduce(
          (n, m) => n + m.lessons.reduce((s, l) => s + (l.duration_minutes || 10), 0), 0
        ) / 60
      );

    const { data: courseRow, error: courseErr } = await db
      .from('training_courses')
      .insert({
        course_name:    course.title,
        title:          course.title,
        description:    course.description,
        category:       course.category,
        duration_hours: durationHours,
        slug,
        is_published:   is_published && TRUSTED_PUBLISH_ROLES.has(callerRole ?? ''),
        is_active:      is_published && TRUSTED_PUBLISH_ROLES.has(callerRole ?? ''),
        status:         resolvePublishStatus(is_published, callerRole),
        passing_score:  course.passing_score ?? 70,
        created_by:     user.id,
        metadata: {
          subtitle:     course.subtitle,
          audience:     course.audience,
          generated:    true,
          generated_at: new Date().toISOString(),
          generated_by: user.id,
        },
      })
      .select('id, slug')
      .single();

    if (courseErr) throw new Error(`Course insert: ${courseErr.message}`);
    const courseId = courseRow.id;

    // ── 2. Lesson records ───────────────────────────────────────────────────
    const lessonRows = course.modules.flatMap((mod, modIdx) =>
      mod.lessons.map((lesson) => ({
        course_id:        courseId,
        lesson_number:    lesson.lesson_number,
        title:            lesson.title,
        description:      lesson.description,
        content:          lesson.content,
        content_type:     lesson.content_type,
        duration_minutes: lesson.duration_minutes,
        is_required:      lesson.is_required ?? true,
        is_published,
        order_index:      lesson.lesson_number - 1,
        quiz_questions:   lesson.quiz_questions?.length ? lesson.quiz_questions : null,
        metadata: {
          module_title: mod.title,
          module_index: modIdx,
          objectives:   lesson.objectives ?? [],
        },
      }))
    );

    const { error: lessonsErr } = await db.from('training_lessons').insert(lessonRows);
    if (lessonsErr) throw new Error(`Lessons insert: ${lessonsErr.message}`);

    // ── 2b. curriculum_lessons parallel write ───────────────────────────────
    // Only when program_id is present (NOT NULL constraint on curriculum_lessons).
    if (program_id) {
      // Upsert modules first so module_id FK can be satisfied on curriculum_lessons.
      const moduleUpsertRows2 = course.modules.map((mod, modIdx) => ({
        program_id,
        title:       mod.title,
        slug:        mod.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80),
        order_index: modIdx,
      }));
      const { data: upsertedModules2, error: modErr2 } = await db
        .from('modules')
        .upsert(moduleUpsertRows2, { onConflict: 'program_id,slug', ignoreDuplicates: false })
        .select('id, slug');
      if (modErr2) logger.warn('modules upsert failed (non-fatal)', { error: modErr2.message });
      const moduleIdBySlug2 = new Map<string, string>(
        (upsertedModules2 ?? []).map((m: { id: string; slug: string }) => [m.slug, m.id])
      );

      const curriculumRows = course.modules.flatMap((mod, modIdx) => {
        const totalInModule = mod.lessons.length;
        const isFinalModule = modIdx === course.modules.length - 1;
        const modSlug2 = mod.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
        const resolvedModuleId2 = moduleIdBySlug2.get(modSlug2) ?? null;

        return mod.lessons.map((lesson, lessonIdx) => {
          const slugBase = lesson.title
            .toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80);

          const titleLower = lesson.title.toLowerCase();
          const isLastInModule = lessonIdx === totalInModule - 1;
          const isCheckpoint =
            titleLower.includes('checkpoint') ||
            titleLower.includes('module assessment') ||
            (isLastInModule && !isFinalModule);

          const step_type: string =
            isCheckpoint                                    ? 'checkpoint' :
            titleLower.includes('exam') ||
            titleLower.includes('final assessment')         ? 'exam' :
            titleLower.includes('lab') ||
            titleLower.includes('hands-on')                 ? 'lab' :
            titleLower.includes('assignment') ||
            titleLower.includes('reflection')               ? 'assignment' :
            lesson.content_type === 'quiz' ||
            (lesson.quiz_questions?.length ?? 0) > 0        ? 'quiz' :
                                                              'lesson';

          return {
            program_id,
            course_id:         courseId,
            module_id:         resolvedModuleId2,
            lesson_slug:       `${slugBase}-${lesson.lesson_number}`,
            lesson_title:      lesson.title,
            lesson_order:      lesson.lesson_number - 1,
            module_order:      modIdx,
            module_title:      mod.title,
            step_type,
            passing_score:     isCheckpoint ? 80 : 0,
            script_text:       lesson.content,
            summary_text:      lesson.summary_text || lesson.description || '',
            reflection_prompt: lesson.reflection_prompt || '',
            competency_keys:   lesson.competency_keys ?? [],
            key_terms:         [] as Array<{ term: string; definition: string }>,
            duration_minutes:  lesson.duration_minutes,
            status:            resolvePublishStatus(is_published, callerRole),
          };
        });
      });

      const { error: clErr } = await db.from('curriculum_lessons').insert(curriculumRows);
      if (clErr) {
        logger.warn('curriculum_lessons parallel write failed (non-fatal)', {
          courseId, programId: program_id, error: clErr.message,
        });
      } else {
        logger.info('curriculum_lessons parallel write succeeded', {
          courseId, programId: program_id, count: curriculumRows.length,
        });
      }
    }

    // ── 3. Completion rule ──────────────────────────────────────────────────
    // entity_type/entity_id pattern — no direct course_id column on this table
    const { error: ruleErr } = await db.from('completion_rules').insert({
      entity_type: 'course',
      entity_id:   courseId,
      rule_type:   course.completion_rule ?? 'all_lessons',
      config:      { passing_score: course.passing_score ?? 70 },
      is_active:   true,
    });
    if (ruleErr) logger.warn('completion_rules insert (non-fatal):', ruleErr.message);

    // ── 4. Program mapping ──────────────────────────────────────────────────
    // order_index is the real column name (not sort_order)
    if (program_id) {
      const { error: pcErr } = await db
        .from('program_courses')
        .upsert(
          { program_id, course_id: courseId, is_required: true, order_index: 0 },
          { onConflict: 'program_id,course_id', ignoreDuplicates: true }
        );
      if (pcErr) logger.warn('program_courses upsert (non-fatal):', pcErr.message);
    }

    const finalStatus = resolvePublishStatus(is_published, callerRole);
    logger.info('Course published from generator', {
      userId: user.id, courseId, slug: courseRow.slug, status: finalStatus,
      title: course.title, lessons: lessonRows.length, programId: program_id,
    });

    return NextResponse.json({ ok: true, courseId, slug: courseRow.slug, lessonCount: lessonRows.length, status: finalStatus });
  } catch (err: any) {
    logger.error('Course publish error:', err);
    return NextResponse.json({ ok: false, error: 'Publish failed' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/admin/courses/generate/publish', _POST);
