/**
 * POST /api/admin/courses/[courseId]/generate-missing
 * Generates missing lessons for a blueprint-backed canonical course.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { loadAllBlueprints } from '@/lib/curriculum/load-blueprint';
import { generateCourseFromBlueprint } from '@/lib/curriculum/generate-course-from-blueprint';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const db = await requireAdminClient();

  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id, slug, title, program_id, programs(slug)')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) return safeInternalError(courseError, 'Failed to load course');
  if (!course) return safeError('Course not found', 404);

  const relatedPrograms = course.programs as unknown as Array<{ slug: string }> | { slug: string } | null;
  const programSlug = Array.isArray(relatedPrograms)
    ? relatedPrograms[0]?.slug ?? null
    : relatedPrograms?.slug ?? null;

  if (!programSlug) {
    return safeError('Course has no linked program — cannot determine blueprint', 400);
  }

  const blueprint = (await loadAllBlueprints()).find((bp) => bp.programSlug === programSlug);
  if (!blueprint) return safeError(`No blueprint registered for program slug: ${programSlug}`, 400);

  const programId = course.program_id as string | null;
  if (!programId) return safeError('Course has no program_id — cannot generate', 400);

  try {
    const result = await generateCourseFromBlueprint({
      courseId: course.id,
      blueprintSlug: blueprint.id,
      programId,
      mode: 'missing-only',
    });

    return NextResponse.json({
      ok: true,
      courseId: result.courseId,
      blueprintSlug: blueprint.id,
      moduleCount: result.moduleCount,
      lessonCount: result.lessonCount,
      skipped: result.skipped,
      warnings: result.warnings,
    });
  } catch (err) {
    return safeInternalError(err, 'Generation failed');
  }
}
