import { NextResponse } from 'next/server';
import { EnrollmentCreateSchema } from '@/lib/validators/course';
import { createEnrollment } from '@/lib/db/courses';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { sendCourseEnrollmentEmail } from '@/lib/email-course-notifications';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, profile };
}

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id') || undefined;
    const userId = searchParams.get('user_id') || undefined;
    const status = searchParams.get('status') || undefined;

    // Use admin client — program_enrollments is the canonical enrollment table
    const db = await requireAdminClient();
    let query = db
      .from('program_enrollments')
      .select('*, student:profiles!program_enrollments_user_id_fkey(id, full_name, email), program:programs(id, title, slug)')
      .order('enrolled_at', { ascending: false });
    if (courseId) query = query.eq('course_id', courseId) as typeof query;
    if (userId) query = query.eq('user_id', userId) as typeof query;
    if (status) query = query.eq('status', status) as typeof query;

    const { data, error } = await query;
    if (error) {
      logger.error('[/api/admin/enrollments] DB error', error);
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (error: any) {
    logger.error('[/api/admin/enrollments] Unexpected error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json().catch(() => null);
    const parsed = EnrollmentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = await createEnrollment(parsed.data);

    // Send enrollment confirmation email (fire-and-forget)
    sendCourseEnrollmentEmail({
      studentEmail: parsed.data.email || '',
      studentName: parsed.data.studentName || 'Student',
      courseName: parsed.data.courseName || 'Course',
      courseSlug: parsed.data.courseSlug || '',
      enrollmentDate: new Date().toISOString(),
    }).catch((err) => logger.error('Failed to send enrollment email', err));

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/enrollments', _GET);
export const POST = withApiAudit('/api/admin/enrollments', _POST);
