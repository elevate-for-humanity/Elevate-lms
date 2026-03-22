export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getAllBlueprints } from '@/lib/curriculum/blueprints';
import { generateCourseFromBlueprint } from '@/lib/curriculum/generate-course-from-blueprint';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const auth = await apiRequireAdmin(_request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const supabase = createAdminClient();

  const { data: course, error: courseError } = await supabase
    .from('training_courses')
    .select('id, slug, course_name, program_id, programs(slug)')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) return safeInternalError(courseError, 'Failed to load course');
  if (!course) return safeError('Course not found', 404);

  const programSlug = (course.programs as { slug: string } | null)?.slug ?? null;
  if (!programSlug) return safeError('Course has no linked program — cannot determine blueprint', 400);

  const blueprint = getAllBlueprints().find(bp => bp.programSlug === programSlug);
  if (!blueprint) return safeError(`No blueprint registered for program slug: ${programSlug}`, 400);

  try {
    const result = await generateCourseFromBlueprint({
      courseId: course.id,
      blueprintSlug: blueprint.credentialSlug,
      mode: 'missing-only',
    });

    return NextResponse.json({ ok: true, courseId: course.id, blueprintSlug: blueprint.credentialSlug, result });
  } catch (err) {
    return safeInternalError(err, 'Generation failed');
  }
}
