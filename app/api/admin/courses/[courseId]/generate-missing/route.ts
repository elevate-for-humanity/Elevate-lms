export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/courses/[courseId]/generate-missing
 *
 * Generates missing lessons for a blueprint-backed course.
 * Writes to: courses → course_modules → course_lessons (canonical tables).
 * Does NOT write to curriculum_lessons or training_lessons.
 *
 * courseId must be a courses.id (canonical table), not training_courses.id.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getAllBlueprints } from '@/lib/curriculum/blueprints';
import { generateCourseFromBlueprint } from '@/lib/curriculum/generate-course-from-blueprint';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const db = createAdminClient();

  // Resolve course from canonical courses table (not training_courses)
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id, slug, title, program_id, programs(slug)')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) return safeInternalError(courseError, 'Failed to load course');
  if (!course)     return safeError('Course not found', 404);

  const programSlug = (course.programs as { slug: string } | null)?.slug ?? null;
  if (!programSlug) return safeError('Course has no linked program — cannot determine blueprint', 400);

  const blueprint = getAllBlueprints().find(bp => bp.programSlug === programSlug);
  if (!blueprint)  return safeError(`No blueprint registered for program slug: ${programSlug}`, 400);

  const programId = course.program_id as string | null;
  if (!programId)  return safeError('Course has no program_id — cannot generate', 400);

  try {
    const result = await generateCourseFromBlueprint({
      courseId:      course.id,
      blueprintSlug: blueprint.id,
      programId,
      mode:          'missing-only',
    });

    return NextResponse.json({
      ok:            true,
      courseId:      result.courseId,
      blueprintSlug: blueprint.id,
      moduleCount:   result.moduleCount,
      lessonCount:   result.lessonCount,
      skipped:       result.skipped,
      warnings:      result.warnings,
    });
  } catch (err) {
    return safeInternalError(err, 'Generation failed');
  }
}
