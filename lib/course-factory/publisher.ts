/**
 * publisher.ts
 * 
 * Single unified publish pipeline.
 * Consolidates:
 * - lib/course-builder/pipeline.ts (runCoursePublishPipeline)
 * - lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts
 * 
 * Writes to: courses → course_modules → course_lessons
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import type { 
  BlueprintModule, 
  BlueprintLessonRef, 
  BuildMode,
  ValidationResult 
} from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublishInput {
  programId: string;
  courseSlug: string;
  courseTitle: string;
  blueprint: BlueprintModule[];
  mode: BuildMode;
  contentSource?: 'blueprint' | 'curriculum_lessons';
  videoConfig?: { enabled: boolean };
}

export interface PublishResult {
  success: boolean;
  courseId: string;
  moduleCount: number;
  lessonCount: number;
  skippedCount: number;
  warnings: string[];
  errors: string[];
  validation: ValidationResult;
}

interface LessonFailure {
  slug: string;
  reason: string;
}

// ─── Validation ────────────────────────────────────────────────────────────────

function validateLessonSlug(slug: string): boolean {
  // Check for invalid characters
  return /^[a-z0-9-]+$/.test(slug.toLowerCase());
}

function inferStepType(slug: string): string {
  const lower = slug.toLowerCase();
  if (lower.includes('checkpoint') || lower.includes('quiz')) return 'checkpoint';
  if (lower.includes('exam') || lower.includes('final')) return 'exam';
  if (lower.includes('lab')) return 'lab';
  if (lower.includes('assignment')) return 'assignment';
  return 'lesson';
}

function validateBlueprint(blueprint: BlueprintModule[]): ValidationResult {
  const errors: Array<{ lessonSlug: string; field: string; message: string; severity: 'error' | 'warning' }> = [];
  const warnings: Array<{ lessonSlug: string; field: string; message: string; severity: 'error' | 'warning' }> = [];

  for (const mod of blueprint) {
    if (!mod.slug) {
      errors.push({ lessonSlug: '', field: 'module.slug', message: 'Module slug is required', severity: 'error' });
      continue;
    }

    if (!validateLessonSlug(mod.slug)) {
      errors.push({ lessonSlug: mod.slug, field: 'module.slug', message: 'Invalid slug format', severity: 'error' });
    }

    for (const lesson of mod.lessons ?? []) {
      if (!lesson.slug) {
        errors.push({ lessonSlug: '', field: 'lesson.slug', message: 'Lesson slug is required', severity: 'error' });
        continue;
      }

      if (!validateLessonSlug(lesson.slug)) {
        errors.push({ lessonSlug: lesson.slug, field: 'lesson.slug', message: 'Invalid slug format', severity: 'error' });
      }

      const stepType = inferStepType(lesson.slug);
      
      // Content requirements based on step type
      if (stepType !== 'exam') {
        if (!lesson.content || lesson.content.trim().length < 100) {
          warnings.push({ 
            lessonSlug: lesson.slug, 
            field: 'content', 
            message: 'Content may be too short (< 100 chars)', 
            severity: 'warning' 
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length,
  };
}

// ─── Upsert Helpers ────────────────────────────────────────────────────────────

async function upsertCourse(
  db: SupabaseClient,
  slug: string,
  title: string,
  programId: string,
): Promise<string> {
  // Check if exists
  const { data: existing } = await db
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing?.id) {
    await db
      .from('courses')
      .update({
        title,
        program_id: programId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data: newCourse, error } = await db
    .from('courses')
    .insert({
      slug,
      title,
      program_id: programId,
      status: 'draft',
      is_active: true,
    })
    .select('id')
    .maybeSingle();

  if (error || !newCourse) {
    throw new Error(`Failed to create course: ${error?.message}`);
  }

  return newCourse.id;
}

async function upsertModule(
  db: SupabaseClient,
  courseId: string,
  module: BlueprintModule,
): Promise<string | null> {
  // Check if exists
  const { data: existing } = await db
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', module.slug)
    .maybeSingle();

  if (existing?.id) {
    await db
      .from('course_modules')
      .update({
        title: module.title,
        description: module.description,
        order_index: module.orderIndex,
      })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data: newModule, error } = await db
    .from('course_modules')
    .insert({
      course_id: courseId,
      slug: module.slug,
      title: module.title,
      description: module.description,
      order_index: module.orderIndex,
    })
    .select('id')
    .maybeSingle();

  if (error || !newModule) {
    logger.error('[publisher] Module upsert failed', { module: module.slug, error });
    return null;
  }

  return newModule.id;
}

async function upsertLesson(
  db: SupabaseClient,
  courseId: string,
  moduleId: string,
  lesson: BlueprintLessonRef,
): Promise<boolean> {
  const stepType = inferStepType(lesson.slug);

  // Build quiz questions array
  const quizQuestions = lesson.quizQuestions?.map((q) => ({
    question: q.question,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
  })) ?? null;

  // Check if exists
  const { data: existing } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', lesson.slug)
    .maybeSingle();

  const lessonData = {
    course_id: courseId,
    module_id: moduleId,
    slug: lesson.slug,
    title: lesson.title,
    lesson_type: stepType,
    order_index: lesson.order,
    objective: lesson.objective ?? null,
    content: lesson.content ?? null,
    quiz_questions: quizQuestions,
    passing_score: lesson.passingScore ?? (stepType === 'exam' ? 80 : 70),
    activities: null,
    status: 'draft',
    is_published: false,
  };

  if (existing?.id) {
    const { error } = await db
      .from('course_lessons')
      .update(lessonData)
      .eq('id', existing.id);
    
    if (error) {
      logger.error('[publisher] Lesson update failed', { lesson: lesson.slug, error });
      return false;
    }
    return true;
  }

  const { error } = await db.from('course_lessons').insert(lessonData);
  
  if (error) {
    logger.error('[publisher] Lesson insert failed', { lesson: lesson.slug, error });
    return false;
  }

  return true;
}

// ─── Main Publisher ────────────────────────────────────────────────────────────

/**
 * Single unified publish function.
 * 
 * Steps:
 * 1. Upsert course
 * 2. Validate blueprint
 * 3. Upsert modules & lessons
 * 4. Handle replace vs missing-only mode
 */
export async function publishCourse(input: PublishInput): Promise<PublishResult> {
  const db = await requireAdminClient();
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Validate blueprint
  const validation = validateBlueprint(input.blueprint);
  
  if (!validation.valid) {
    return {
      success: false,
      courseId: '',
      moduleCount: 0,
      lessonCount: 0,
      skippedCount: 0,
      warnings,
      errors: validation.errors.map((e) => `${e.lessonSlug || 'module'}: ${e.message}`),
      validation,
    };
  }

  warnings.push(...validation.warnings.map((w) => `Warning: ${w.message}`));

  // 2. Upsert course
  let courseId: string;
  try {
    courseId = await upsertCourse(db, input.courseSlug, input.courseTitle, input.programId);
  } catch (err) {
    return {
      success: false,
      courseId: '',
      moduleCount: 0,
      lessonCount: 0,
      skippedCount: 0,
      warnings,
      errors: [`Course upsert failed: ${err instanceof Error ? err.message : String(err)}`],
      validation,
    };
  }

  // 3. Replace mode: wipe existing
  if (input.mode === 'replace') {
    await db.from('course_lessons').delete().eq('course_id', courseId);
    await db.from('course_modules').delete().eq('course_id', courseId);
    logger.info('[publisher] Replace mode: cleared existing modules and lessons');
  }

  // 4. Load existing slugs for missing-only mode
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

  // 5. Upsert modules & lessons
  let moduleCount = 0;
  let lessonCount = 0;
  let skippedCount = 0;

  const sortedModules = [...input.blueprint].sort((a, b) => a.orderIndex - b.orderIndex);

  for (const mod of sortedModules) {
    const moduleId = await upsertModule(db, courseId, mod);
    if (!moduleId) {
      warnings.push(`Module '${mod.slug}' failed to upsert`);
      continue;
    }
    moduleCount++;

    const sortedLessons = [...(mod.lessons ?? [])].sort((a, b) => a.order - b.order);

    for (const lesson of sortedLessons) {
      // Skip existing in missing-only mode
      if (input.mode === 'missing-only' && existingSlugs.has(lesson.slug)) {
        skippedCount++;
        continue;
      }

      const ok = await upsertLesson(db, courseId, moduleId, lesson);
      if (ok) {
        lessonCount++;
      } else {
        errors.push(`Lesson '${lesson.slug}' failed to upsert`);
      }
    }
  }

  return {
    success: errors.length === 0,
    courseId,
    moduleCount,
    lessonCount,
    skippedCount,
    warnings,
    errors,
    validation,
  };
}

// ─── Atomic Publish ────────────────────────────────────────────────────────────

/**
 * Atomic publish with DB transaction.
 * Uses the publish_course_from_staging RPC function.
 */
export async function publishCourseAtomic(
  courseId: string,
  programId?: string | null,
): Promise<{ success: boolean; lessonsPublished?: number; error?: string }> {
  const db = await requireAdminClient();

  const { data, error } = await db.rpc('publish_course_from_staging', {
    p_course_id: courseId,
    p_program_id: programId && programId !== courseId ? programId : null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    lessonsPublished: (data as { lessons_published?: number })?.lessons_published,
  };
}
