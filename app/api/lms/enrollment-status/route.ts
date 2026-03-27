
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lms/enrollment-status?courseId=<uuid>
 *
 * Returns the current user's enrollment status for a course.
 * Reads from program_enrollments (canonical). Admin client bypasses RLS.
 */
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get('courseId');
  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const db = admin || supabase;

  // Resolve canonical courses UUID.
  // The URL param may be a training_courses ID (legacy HVAC routes). In that
  // case program_enrollments.course_id stores the canonical courses UUID, so
  // a direct lookup with the raw param returns nothing.
  // Resolution: if the param matches a courses row directly, use it. Otherwise
  // look it up in training_courses and follow the slug to courses.
  let resolvedCourseId = courseId;
  const { data: directCourse } = await db
    .from('courses')
    .select('id, program_id')
    .eq('id', courseId)
    .maybeSingle();

  if (!directCourse) {
    // Not a canonical courses UUID — try training_courses
    const { data: tc } = await db
      .from('training_courses')
      .select('id, slug')
      .eq('id', courseId)
      .maybeSingle();
    if (tc?.slug) {
      const { data: canonical } = await db
        .from('courses')
        .select('id')
        .eq('slug', tc.slug)
        .maybeSingle();
      if (canonical?.id) resolvedCourseId = canonical.id;
    }
  }

  const resolvedProgramId = directCourse?.program_id ?? null;

  // Primary lookup: by resolved canonical course_id
  let { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, status, enrollment_state, progress_percent, enrolled_at')
    .eq('user_id', user.id)
    .eq('course_id', resolvedCourseId)
    .maybeSingle();

  // Fallback: some enrollments are stored against program_id only (no course_id).
  if (!enrollment && resolvedProgramId) {
    const { data: programEnrollment } = await db
      .from('program_enrollments')
      .select('id, status, enrollment_state, progress_percent, enrolled_at')
      .eq('user_id', user.id)
      .eq('program_id', resolvedProgramId)
      .maybeSingle();
    enrollment = programEnrollment;
  }

  const isPendingFunding = enrollment?.enrollment_state === 'pending_funding_verification';
  const effectiveStatus = isPendingFunding ? 'pending_funding_verification'
    : (enrollment?.status ?? null);

  const approved = !!enrollment && !isPendingFunding
    && !['pending_approval', 'pending'].includes(enrollment?.status ?? '');

  return NextResponse.json({
    enrolled:         !!enrollment,
    status:           effectiveStatus,
    enrollment_state: enrollment?.enrollment_state ?? null,
    progress:         enrollment?.progress_percent ?? 0,
    approved,
  });
}
