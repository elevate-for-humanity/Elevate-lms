import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { requireApiRole } from '@/lib/auth/require-api-role';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

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
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .in('status', ['active', 'in_progress', 'enrolled', 'confirmed'])
      .maybeSingle();

    if (!enrollment) {
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
