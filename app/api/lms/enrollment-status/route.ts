import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { resolveLatestEnrollment } from '@/lib/enrollment/resolver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/lms/enrollment-status?courseId=<uuid>
 *
 * Returns the current user's enrollment status for a course.
 * Uses canonical enrollment resolver (program_enrollments + training_enrollments fallback).
 */
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const courseId = req.nextUrl.searchParams.get('courseId');
  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await requireAdminClient();
  const db = admin || supabase;

  // Admins bypass enrollment check
  if (admin) {
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) {
      return NextResponse.json({
        enrolled: true,
        status: 'active',
        enrollment_state: 'active',
        progress: 0,
        approved: true,
        isAdmin: true,
      });
    }
  }

  // Resolve canonical course UUID
  let resolvedCourseId = courseId;
  const { data: directCourse } = await db
    .from('courses')
    .select('id, program_id')
    .eq('id', courseId)
    .maybeSingle();

  if (!directCourse) {
    const { data: tc } = await db
      .from('lms_courses')
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

  // Use canonical resolver to get latest enrollment
  const enrollment = await resolveLatestEnrollment({
    client: db,
    userId: user.id,
    prefer: 'program_enrollments',
  });

  // Check if enrolled in this specific course
  const isEnrolledInCourse = 
    enrollment &&
    (enrollment.courseId === resolvedCourseId ||
     (resolvedProgramId && enrollment.courseId === resolvedCourseId));

  if (enrollment && isEnrolledInCourse) {
    const isPendingFunding = enrollment.enrollmentState === 'pending_funding_verification';
    const effectiveStatus = isPendingFunding ? 'pending_funding_verification' : enrollment.status;
    const approved = !isPendingFunding && !['pending_approval', 'pending'].includes(enrollment.status);

    return NextResponse.json({
      enrolled: true,
      status: effectiveStatus,
      enrollment_state: enrollment.enrollmentState,
      progress: enrollment.progress,
      approved,
    });
  }

  return NextResponse.json({
    enrolled: false,
    status: null,
    enrollment_state: null,
    progress: 0,
    approved: false,
  });
}
