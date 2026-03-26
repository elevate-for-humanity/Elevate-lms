import { NextRequest, NextResponse } from 'next/server';

import { requireApiRole } from '@/lib/auth/require-api-role';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

/**
 * Start course progress tracking
 * POST /api/lms/progress/start
 * Body: { courseId: string }
 */
async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireApiRole(['student', 'admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;

    const { user, db } = auth;

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // Verify enrollment before allowing progress tracking
    const { data: enrollment } = await db
      .from('program_enrollments')
      .select('id, status, enrollment_state')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    // Explicit access gate: status OR enrollment_state must grant access.
    // pending_funding_verification retains provisional LMS access by policy.
    // See enrollment_grants_lms_access() in DB and docs/enrollment-funding-states.md.
    const accessStates = ['active', 'in_progress', 'enrolled', 'confirmed', 'pending_funding_verification'];
    const enrollmentGrantsAccess = enrollment &&
      (accessStates.includes(enrollment.status) || accessStates.includes(enrollment.enrollment_state));

    const enrollment_checked = enrollmentGrantsAccess ? enrollment : null;

    if (!enrollment_checked) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 },
      );
    }

    // Get course details
    const { data: course } = await db
      .from('courses')
      .select('slug')
      .eq('id', courseId)
      .single();

    // Upsert progress record
    const { error } = await db.from('lms_progress').upsert(
      {
        user_id: user.id,
        course_id: courseId,
        course_slug: course?.slug,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,course_id',
      }
    );

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    return NextResponse.json(
      {
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/lms/progress/start', _POST);
