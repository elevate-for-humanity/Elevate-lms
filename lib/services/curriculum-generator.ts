/**
 * CurriculumGenerator
 *
 * Idempotent curriculum generator. Writes program curriculum into the
 * learner-visible tables: course_modules and course_lessons.
 *
 * Write path (canonical, learner-visible):
 *   course_modules  — keyed on (course_id, order_index)
 *   course_lessons  — keyed on (course_id, slug)
 *
 * Draft/audit trail (secondary, admin-editor-visible):
 *   curriculum_lessons — still written for the admin curriculum editor
 *   modules            — still written for program-level module registry
 *
 * Identity resolution:
 *   blueprint.programSlug → programs.id → courses.id (via courses.program_id)
 *   module.orderIndex → course_modules.order_index
 *   order_index = module.orderIndex * 1000 + lesson.order (matches HVAC convention)
 *
 * Content:
 *   BlueprintLessonRef has no scriptText. course_lessons.content is seeded
 *   with a structured placeholder. Pass { seedMode: true } to allow this
 *   explicitly — seedMode is loud and logs every placeholder lesson.
 *   In production, lessons with no scriptText are skipped unless seedMode=true.
 *
 * Note: BlueprintLessonRef.stepType does not exist on the current type.
 *   All blueprint lessons are seeded as 'lesson' type. Set step_type to
 *   'checkpoint' manually in the DB for module-boundary quiz lessons, or
 *   extend BlueprintLessonRef with stepType when the blueprint data is ready.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import type {
  CourseBlueprint,
  BlueprintModule,
  BlueprintLessonRef,
} from '@/lib/curriculum/blueprints/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratorOptions {
  /**
   * Allow lessons with no scriptText to be seeded with placeholder content.
   * Every bypassed lesson is logged. Not for production content.
   */
  seedMode?: boolean;
  /** Validate and log but do not write to DB. */
  dryRun?: boolean;
}

export interface LessonResult {
  lessonSlug: string;
  moduleOrder: number;
  lessonOrder: number;
  status: 'upserted' | 'skipped' | 'dry_run';
  reason?: string;
}

export interface ModuleResult {
  moduleSlug: string;
  moduleOrder: number;
  courseModuleId: string | null;
  lessons: LessonResult[];
}

export interface GeneratorResult {
  programSlug: string;
  programId: string;
  courseId: string;
  modules: ModuleResult[];
  totalLessons: number;
  upserted: number;
  skipped: number;
}

// ── Content packing ───────────────────────────────────────────────────────────

function packContent(lesson: BlueprintLessonRef, seedMode: boolean): Record<string, unknown> {
  return {
    version: 1,
    // Placeholder content — replace with real scriptText before publishing
    instructionalContent: seedMode
      ? `<p><em>Lesson content for "${lesson.title}" — pending authoring.</em></p>`
      : '',
    keyTerms: [],
    objectives: [],
    domainKey: lesson.domainKey ?? null,
  };
}

// ── Generator ─────────────────────────────────────────────────────────────────

export class CurriculumGenerator {
  private db: SupabaseClient;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  async generate(
    blueprint: CourseBlueprint,
    options: GeneratorOptions = {}
  ): Promise<GeneratorResult> {
    const { seedMode = false, dryRun = false } = options;

    if (seedMode) {
      logger.warn(
        '[CurriculumGenerator] seedMode=true — placeholder content will be written. Not for production.'
      );
    }

    // ── 1. Resolve program_id from programSlug ────────────────────────────────
    const { data: program, error: programErr } = await this.db
      .from('programs')
      .select('id')
      .eq('slug', blueprint.programSlug)
      .single();

    if (programErr || !program) {
      throw new Error(
        `[CurriculumGenerator] No program found for slug="${blueprint.programSlug}". ` +
          `Ensure a programs row exists with slug="${blueprint.programSlug}" before generating.`
      );
    }

    const programId = program.id as string;

    // ── 2. Resolve course_id from program_id ──────────────────────────────────
    const { data: course, error: courseErr } = await this.db
      .from('courses')
      .select('id')
      .eq('program_id', programId)
      .single();

    if (courseErr || !course) {
      throw new Error(
        `[CurriculumGenerator] No course found for program_id=${programId} ` +
          `(programSlug="${blueprint.programSlug}"). ` +
          `Create a courses row with program_id=${programId} before generating.`
      );
    }

    const courseId = course.id as string;

    const result: GeneratorResult = {
      programSlug: blueprint.programSlug,
      programId,
      courseId,
      modules: [],
      totalLessons: 0,
      upserted: 0,
      skipped: 0,
    };

    // ── 3. Process each module ────────────────────────────────────────────────
    for (const mod of blueprint.modules) {
      if (!mod.lessons?.length) {
        logger.warn('[CurriculumGenerator] Module has no lessons — skipping', {
          moduleSlug: mod.slug,
          courseId,
        });
        continue;
      }

      const moduleResult = await this.processModule(
        mod,
        courseId,
        programId,
        seedMode,
        dryRun
      );
      result.modules.push(moduleResult);
      result.totalLessons += moduleResult.lessons.length;
      result.upserted += moduleResult.lessons.filter(
        (l) => l.status === 'upserted' || l.status === 'dry_run'
      ).length;
      result.skipped += moduleResult.lessons.filter((l) => l.status === 'skipped').length;
    }

    logger.info(
      `[CurriculumGenerator] ${dryRun ? 'DRY RUN ' : ''}Complete: ` +
        `program=${blueprint.programSlug} course=${courseId} ` +
        `modules=${result.modules.length} lessons=${result.totalLessons} ` +
        `upserted=${result.upserted} skipped=${result.skipped}`
    );

    return result;
  }

  private async processModule(
    mod: BlueprintModule,
    courseId: string,
    programId: string,
    seedMode: boolean,
    dryRun: boolean
  ): Promise<ModuleResult> {
    const moduleResult: ModuleResult = {
      moduleSlug: mod.slug,
      moduleOrder: mod.orderIndex,
      courseModuleId: null,
      lessons: [],
    };

    if (!dryRun) {
      // ── 3a. Upsert course_modules (learner-visible) ─────────────────────────
      const { data: courseModule, error: cmErr } = await this.db
        .from('course_modules')
        .upsert(
          {
            course_id: courseId,
            title: mod.title,
            order_index: mod.orderIndex,
            type: 'standard',
          },
          { onConflict: 'course_id,order_index', ignoreDuplicates: false }
        )
        .select('id')
        .single();

      if (cmErr || !courseModule) {
        logger.error('[CurriculumGenerator] course_modules upsert failed', {
          moduleSlug: mod.slug,
          courseId,
          error: cmErr?.message,
        });
        // Non-fatal — lessons will have null module_id
      } else {
        moduleResult.courseModuleId = courseModule.id as string;
      }

      // ── 3b. Upsert modules (program-level registry / admin editor) ──────────
      await this.db
        .from('modules')
        .upsert(
          {
            program_id: programId,
            title: mod.title,
            order_index: mod.orderIndex,
          },
          { onConflict: 'program_id,order_index', ignoreDuplicates: false }
        );
    }

    for (const lesson of mod.lessons!) {
      const lessonResult = await this.processLesson(
        lesson,
        mod,
        courseId,
        programId,
        moduleResult.courseModuleId,
        seedMode,
        dryRun
      );
      moduleResult.lessons.push(lessonResult);
    }

    return moduleResult;
  }

  private async processLesson(
    lesson: BlueprintLessonRef,
    mod: BlueprintModule,
    courseId: string,
    programId: string,
    courseModuleId: string | null,
    seedMode: boolean,
    dryRun: boolean
  ): Promise<LessonResult> {
    const orderIndex = mod.orderIndex * 1000 + lesson.order;

    if (!seedMode) {
      // Production mode: no scriptText means no content — skip
      logger.warn('[CurriculumGenerator] Skipping lesson — no scriptText (use seedMode=true to seed placeholder)', {
        slug: lesson.slug,
        courseId,
        moduleOrder: mod.orderIndex,
        lessonOrder: lesson.order,
      });
      return {
        lessonSlug: lesson.slug,
        moduleOrder: mod.orderIndex,
        lessonOrder: lesson.order,
        status: 'skipped',
        reason: 'no scriptText — use seedMode=true to seed placeholder content',
      };
    }

    logger.info('[CurriculumGenerator] seedMode: writing placeholder content', {
      slug: lesson.slug,
      courseId,
    });

    if (dryRun) {
      return {
        lessonSlug: lesson.slug,
        moduleOrder: mod.orderIndex,
        lessonOrder: lesson.order,
        status: 'dry_run',
      };
    }

    const content = packContent(lesson, seedMode);

    // ── 4a. Upsert course_lessons (canonical learner-visible write) ───────────
    const { error: clErr } = await this.db
      .from('course_lessons')
      .upsert(
        {
          course_id: courseId,
          module_id: courseModuleId,
          slug: lesson.slug,
          title: lesson.title,
          lesson_type: 'lesson', // default; set checkpoint/quiz in DB after seeding
          order_index: orderIndex,
          content,
          passing_score: null,
          quiz_questions: null,
          is_published: false,
        },
        { onConflict: 'course_id,slug', ignoreDuplicates: false }
      );

    if (clErr) {
      logger.error('[CurriculumGenerator] course_lessons upsert failed', {
        slug: lesson.slug,
        courseId,
        error: clErr.message,
      });
      return {
        lessonSlug: lesson.slug,
        moduleOrder: mod.orderIndex,
        lessonOrder: lesson.order,
        status: 'skipped',
        reason: `course_lessons upsert error: ${clErr.message}`,
      };
    }

    // ── 4b. Upsert curriculum_lessons (draft/admin-editor trail) ─────────────
    // Non-fatal — learner path is course_lessons only.
    await this.db
      .from('curriculum_lessons')
      .upsert(
        {
          program_id: programId,
          course_id: courseId,
          lesson_slug: lesson.slug,
          lesson_title: lesson.title,
          step_type: 'lesson',
          module_order: mod.orderIndex,
          lesson_order: lesson.order,
          script_text: '',
          status: 'draft',
        },
        { onConflict: 'program_id,lesson_slug', ignoreDuplicates: false }
      );

    return {
      lessonSlug: lesson.slug,
      moduleOrder: mod.orderIndex,
      lessonOrder: lesson.order,
      status: 'upserted',
    };
  }
}

// ── Convenience function ──────────────────────────────────────────────────────

export async function buildCourseFromBlueprint(
  blueprint: CourseBlueprint,
  options: GeneratorOptions = {}
): Promise<GeneratorResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '[buildCourseFromBlueprint] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
    );
  }

  const generator = new CurriculumGenerator(supabaseUrl, serviceRoleKey);
  return generator.generate(blueprint, options);
}
