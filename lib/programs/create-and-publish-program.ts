/**
 * Canonical program creation pipeline.
 *
 * Program metadata remains owned here. Course package persistence is delegated
 * to lib/course-factory/publisher so programs cannot create a competing
 * courses -> course_modules -> course_lessons writer.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { publishCourse as persistCoursePackage } from '@/lib/course-factory/publisher';
import type { BlueprintModule } from '@/lib/curriculum/blueprints/types';
import type { ProgramCreateInput, ProgramCreateResult, ProgramLessonInput } from './types';

function assertValidInput(input: ProgramCreateInput): void {
  if (!input.program.slug) throw new Error('program.slug is required');
  if (!input.program.title) throw new Error('program.title is required');
  if (!input.program.description) throw new Error('program.description is required');
  if (!input.modules.length) throw new Error('at least one module is required');

  const moduleSlugs = new Set<string>();
  const lessonSlugs = new Set<string>();

  for (const mod of input.modules) {
    if (!mod.slug) throw new Error('module.slug is required');
    if (!mod.title) throw new Error(`module "${mod.slug}" missing title`);
    if (moduleSlugs.has(mod.slug)) throw new Error(`duplicate module slug: ${mod.slug}`);
    moduleSlugs.add(mod.slug);
    if (!mod.lessons.length) throw new Error(`module "${mod.slug}" has no lessons`);

    for (const lesson of mod.lessons) {
      if (!lesson.slug) throw new Error(`lesson in module "${mod.slug}" missing slug`);
      if (!lesson.title) throw new Error(`lesson "${lesson.slug}" missing title`);
      if (lessonSlugs.has(lesson.slug)) throw new Error(`duplicate lesson slug: ${lesson.slug}`);
      lessonSlugs.add(lesson.slug);

      const needsPassingScore = ['checkpoint', 'quiz', 'exam', 'certification'].includes(
        lesson.lessonType,
      );
      if (needsPassingScore && !lesson.passingScore) {
        throw new Error(
          `lesson "${lesson.slug}" (${lesson.lessonType}) requires passingScore (1–100)`,
        );
      }
    }
  }
}

function lessonSlugForType(lesson: ProgramLessonInput): string {
  const suffix =
    lesson.lessonType === 'checkpoint'
      ? 'checkpoint'
      : lesson.lessonType === 'quiz'
        ? 'quiz'
        : lesson.lessonType === 'exam'
          ? 'exam'
          : lesson.lessonType === 'lab'
            ? 'lab'
            : lesson.lessonType === 'assignment'
              ? 'assignment'
              : lesson.lessonType === 'certification'
                ? 'certification'
                : null;
  if (!suffix || lesson.slug.includes(suffix)) return lesson.slug;
  return `${lesson.slug}-${suffix}`;
}

function toBlueprintModules(input: ProgramCreateInput): BlueprintModule[] {
  return [...input.modules]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((mod) => ({
      slug: mod.slug,
      title: mod.title,
      orderIndex: mod.orderIndex,
      minLessons: mod.lessons.length,
      maxLessons: mod.lessons.length,
      quizRequired: mod.lessons.some((lesson) =>
        ['checkpoint', 'quiz', 'exam'].includes(lesson.lessonType),
      ),
      practicalRequired: mod.lessons.some((lesson) =>
        ['lab', 'assignment'].includes(lesson.lessonType),
      ),
      isCritical: true,
      requiredLessonTypes: [],
      competencies: [],
      lessons: [...mod.lessons]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((lesson) => ({
          slug: lessonSlugForType(lesson),
          title: lesson.title,
          order: mod.orderIndex * 1000 + lesson.orderIndex,
          objective:
            typeof lesson.content?.objective === 'string'
              ? lesson.content.objective
              : `Complete ${lesson.title}`,
          content: JSON.stringify(lesson.content ?? {}),
          passingScore: lesson.passingScore ?? undefined,
          lessonType: lesson.lessonType,
          isRequired: lesson.isRequired ?? true,
        })),
    }));
}

export async function createAndPublishProgram(
  input: ProgramCreateInput,
): Promise<ProgramCreateResult> {
  assertValidInput(input);

  const db = await requireAdminClient();

  for (const table of ['programs', 'courses', 'course_modules', 'course_lessons'] as const) {
    const { error: tableErr } = await db.from(table).select('id').limit(0);
    if (tableErr) {
      throw new Error(
        `createAndPublishProgram pre-flight failed: table "${table}" is not accessible. (${tableErr.message})`,
      );
    }
  }

  const { data: defaultOrg } = await db
    .from('organizations')
    .select('id')
    .eq('slug', input.orgSlug ?? 'elevate-core')
    .maybeSingle();
  const orgId: string | null = defaultOrg?.id ?? null;

  const { data: program, error: programErr } = await db
    .from('programs')
    .upsert(
      {
        slug: input.program.slug,
        title: input.program.title,
        category: input.program.category ?? 'workforce',
        description: input.program.description,
        short_description: input.program.shortDescription ?? null,
        status: input.program.status ?? 'draft',
        published: false,
        is_active: input.program.isActive ?? true,
        delivery_model: input.program.deliveryModel ?? null,
        enrollment_type: input.program.enrollmentType ?? null,
        has_lms_course: true,
        org_id: orgId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' },
    )
    .select('id, slug')
    .single();

  if (programErr || !program) {
    throw new Error(`programs upsert failed: ${programErr?.message ?? 'no row returned'}`);
  }

  const courseOverride = input.course ?? {};
  const courseTitle = courseOverride.title ?? input.program.title;
  const packageResult = await persistCoursePackage({
    programId: program.id,
    courseSlug: input.program.slug,
    courseTitle,
    blueprint: toBlueprintModules(input),
    mode: 'replace',
    contentSource: 'blueprint',
    videoConfig: { enabled: false },
  });

  if (!packageResult.success || !packageResult.courseId) {
    throw new Error(
      `Course Factory persistence failed: ${packageResult.errors.join('; ') || 'unknown error'}`,
    );
  }

  const courseId = packageResult.courseId;
  const { error: metadataErr } = await db
    .from('courses')
    .update({
      short_description:
        courseOverride.shortDescription ??
        input.program.shortDescription ??
        input.program.description.slice(0, 160),
      description: courseOverride.description ?? input.program.description,
      org_id: orgId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId);
  if (metadataErr) throw new Error(`course metadata update failed: ${metadataErr.message}`);

  // Recreate completion rules after the atomic course package has assigned canonical module IDs.
  const { error: delRulesErr } = await db
    .from('module_completion_rules')
    .delete()
    .eq('course_id', courseId);
  if (delRulesErr) throw new Error(`delete module_completion_rules failed: ${delRulesErr.message}`);

  const { data: persistedModules, error: persistedModulesErr } = await db
    .from('course_modules')
    .select('id, order_index')
    .eq('course_id', courseId)
    .order('order_index');
  if (persistedModulesErr) {
    throw new Error(`course_modules lookup failed: ${persistedModulesErr.message}`);
  }

  for (const courseModule of persistedModules ?? []) {
    const { error: ruleErr } = await db.from('module_completion_rules').insert({
      course_id: courseId,
      module_id: courseModule.id,
    });
    if (ruleErr) {
      throw new Error(`module_completion_rules insert failed: ${ruleErr.message}`);
    }
  }

  let published = false;
  if (input.publish === true) {
    const { error: publishCourseErr } = await db.rpc('publish_course', {
      p_course_id: courseId,
    });
    if (publishCourseErr) throw new Error(`publish_course failed: ${publishCourseErr.message}`);

    const { error: programPublishErr } = await db
      .from('programs')
      .update({ published: true, updated_at: new Date().toISOString() })
      .eq('id', program.id);
    if (programPublishErr) {
      throw new Error(`programs publish update failed: ${programPublishErr.message}`);
    }
    published = true;
  }

  return {
    programId: program.id,
    courseId,
    moduleCount: packageResult.moduleCount,
    lessonCount: packageResult.lessonCount,
    published,
  };
}
