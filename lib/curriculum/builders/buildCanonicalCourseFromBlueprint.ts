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

import { createAdminClient } from '@/lib/supabase/admin';
import type { CredentialBlueprint, BlueprintModule, BlueprintLessonRef, BlueprintVideoConfig } from '../blueprints/types';

// ─── Default activity menu per step type ─────────────────────────────────────
// Each lesson gets a default activity set based on its step_type.
// The lesson page renders these as the NHA-style activity menu.
// Instructors can override per-lesson via the admin curriculum builder.

type ActivityDescriptor = {
  type: 'video' | 'reading' | 'flashcards' | 'lab' | 'practice' | 'checkpoint';
  label: string;
  order: number;
  required: boolean;
};

function defaultActivities(stepType: string): ActivityDescriptor[] {
  switch (stepType) {
    case 'checkpoint':
      return [
        { type: 'video',      label: 'Watch Lesson Video',    order: 1, required: true  },
        { type: 'reading',    label: 'Reading',               order: 2, required: true  },
        { type: 'flashcards', label: 'Flashcards',            order: 3, required: false },
        { type: 'practice',   label: 'Practice Questions',    order: 4, required: true  },
        { type: 'checkpoint', label: 'Checkpoint Quiz',       order: 5, required: true  },
      ];
    case 'lab':
      return [
        { type: 'video',      label: 'Watch Lesson Video',    order: 1, required: true  },
        { type: 'reading',    label: 'Reading',               order: 2, required: true  },
        { type: 'lab',        label: 'Hands-On Lab',          order: 3, required: true  },
      ];
    case 'quiz':
    case 'exam':
      return [
        { type: 'video',      label: 'Watch Lesson Video',    order: 1, required: false },
        { type: 'flashcards', label: 'Flashcards',            order: 2, required: false },
        { type: 'practice',   label: 'Practice Questions',    order: 3, required: false },
        { type: 'checkpoint', label: 'Quiz',                  order: 4, required: true  },
      ];
    default: // 'lesson'
      return [
        { type: 'video',      label: 'Watch Lesson Video',    order: 1, required: true  },
        { type: 'reading',    label: 'Reading',               order: 2, required: true  },
        { type: 'flashcards', label: 'Flashcards',            order: 3, required: false },
        { type: 'practice',   label: 'Practice Questions',    order: 4, required: false },
      ];
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuildMode = 'replace' | 'missing-only';

export interface BuildCanonicalCourseInput {
  blueprint:  CredentialBlueprint;
  programId:  string;
  /** Stable slug for the courses row. Defaults to blueprint.programSlug. */
  courseSlug?: string;
  courseTitle?: string;
  mode:       BuildMode;
}

export interface BuildCanonicalCourseResult {
  courseId:     string;
  moduleCount:  number;
  lessonCount:  number;
  skipped:      number;
  warnings:     string[];
}

// ─── Preflight validator ──────────────────────────────────────────────────────

function validateLessons(modules: CredentialBlueprint['modules']): void {
  const slugs      = new Set<string>();
  const orderKeys  = new Set<string>(); // `${moduleOrderIndex}:${lessonOrder}`

  for (const mod of modules) {
    for (const lesson of mod.lessons ?? []) {
      if (!lesson.slug) throw new Error(`Missing slug in module '${mod.slug}' at order ${lesson.order}`);

      if (slugs.has(lesson.slug)) throw new Error(`Duplicate slug: ${lesson.slug}`);
      slugs.add(lesson.slug);

      const key = `${mod.orderIndex}:${lesson.order}`;
      if (orderKeys.has(key)) throw new Error(`Duplicate order ${lesson.order} in module '${mod.slug}'`);
      orderKeys.add(key);

      const stepType = inferStepType(lesson.slug);
      if (stepType === 'exam' && !lesson.slug.includes('practice')) {
        // Certification exams must have a recognisable exam code in the slug
        // (enforced at DB level via partner_exam_code — validated here as a preflight)
        const hasCode = lesson.slug.includes('qbocu') || lesson.slug.includes('icbp') ||
                        lesson.slug.includes('epa') || lesson.slug.includes('certiport');
        if (!hasCode) throw new Error(`Exam lesson '${lesson.slug}' has no recognisable cert code in slug`);
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function buildCanonicalCourseFromBlueprint(
  input: BuildCanonicalCourseInput,
): Promise<BuildCanonicalCourseResult> {
  const db = createAdminClient();
  const warnings: string[] = [];

  const slug  = input.courseSlug  ?? input.blueprint.programSlug;
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
        status:     'draft',
        is_active:  true,
      })
      .select('id')
      .single();

    if (courseErr || !newCourse) {
      throw new Error(`buildCanonicalCourseFromBlueprint: failed to create course — ${courseErr?.message}`);
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

  // ── 5. Upsert modules + lessons in blueprint order ────────────────────────
  let totalLessons = 0;
  let skipped      = 0;

  const sortedModules = [...input.blueprint.modules].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

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

      const ok = await upsertLesson(db, courseId, moduleId, mod, lessonRef, input.blueprint.videoConfig);
      if (ok) {
        totalLessons++;
      } else {
        warnings.push(`Lesson '${lessonRef.slug}' failed to upsert`);
      }
    }
  }

  return {
    courseId,
    moduleCount: sortedModules.length,
    lessonCount: totalLessons,
    skipped,
    warnings,
  };
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
      course_id:   courseId,
      title:       mod.title,
      order_index: mod.orderIndex,
    })
    .select('id')
    .single();

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
): Promise<boolean> {
  // order_index encoding: module * 1000 + lesson (matches course-service.ts convention)
  const orderIndex = mod.orderIndex * 1000 + lessonRef.order;

  // Derive step type from domainKey convention or default to 'lesson'.
  // Blueprint lesson refs don't carry stepType directly — infer from slug suffix.
  const stepType = inferStepType(lessonRef.slug);

  const { data: existing } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', lessonRef.slug)
    .maybeSingle();

  const activities = defaultActivities(stepType);

  if (existing?.id) {
    const { error } = await db
      .from('course_lessons')
      .update({
        module_id:    moduleId,
        title:        lessonRef.title,
        lesson_type:  stepType,
        order_index:  orderIndex,
        activities:   activities,
        ...(videoConfig ? { video_config: videoConfig } : {}),
        updated_at:   new Date().toISOString(),
      })
      .eq('id', existing.id);
    return !error;
  }

  const { error } = await db
    .from('course_lessons')
    .insert({
      course_id:    courseId,
      module_id:    moduleId,
      slug:         lessonRef.slug,
      title:        lessonRef.title,
      lesson_type:  stepType,
      order_index:  orderIndex,
      is_required:  true,
      is_published: true,
      status:       'published',
      activities:   activities,
      ...(videoConfig ? { video_config: videoConfig } : {}),
    });

  return !error;
}

/**
 * Infer lesson_type from slug suffix.
 * Blueprint lesson refs don't carry stepType — use slug conventions.
 */
function inferStepType(slug: string): string {
  if (slug.endsWith('-checkpoint')) return 'checkpoint';
  if (slug.endsWith('-exam') || slug.includes('final-') || slug.includes('practice-exam')) return 'exam';
  if (slug.endsWith('-quiz')) return 'quiz';
  if (slug.endsWith('-lab')) return 'lab';
  if (slug.endsWith('-assignment')) return 'assignment';
  if (slug.endsWith('-certification')) return 'certification';
  return 'lesson';
}
