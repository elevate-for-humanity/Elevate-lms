
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

  // Primary lookup: by course_id (most enrollments set this directly)
  let { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, status, enrollment_state, progress_percent, enrolled_at, revoked_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  // Fallback: some enrollments are stored against program_id only (no course_id).
  // Resolve the program_id from the courses table and retry.
  if (!enrollment) {
    const { data: course } = await db
      .from('courses')
      .select('program_id')
      .eq('id', courseId)
      .maybeSingle();

    if (course?.program_id) {
      const { data: programEnrollment } = await db
        .from('program_enrollments')
        .select('id, status, enrollment_state, progress_percent, enrolled_at, revoked_at')
        .eq('user_id', user.id)
        .eq('program_id', course.program_id)
        .maybeSingle();
      enrollment = programEnrollment;
    }
  }

  const isRevoked = !!enrollment?.revoked_at;
  const isPendingFunding = enrollment?.enrollment_state === 'pending_funding_verification';
  const effectiveStatus = isRevoked ? 'revoked'
    : isPendingFunding ? 'pending_funding_verification'
    : (enrollment?.status ?? null);

  // approved=false blocks lesson page from loading content.
  // pending_funding_verification is explicitly not approved — student has no
  // confirmed funding source and must not access lesson content.
  const approved = !!enrollment && !isRevoked && !isPendingFunding
    && !['pending_approval', 'pending'].includes(enrollment.status ?? '');

  return NextResponse.json({
    enrolled:         !!enrollment && !isRevoked,
    status:           effectiveStatus,
    enrollment_state: enrollment?.enrollment_state ?? null,
    progress:         enrollment?.progress_percent ?? 0,
    approved,
  });
}
