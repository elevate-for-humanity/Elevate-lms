import { NextResponse } from 'next/server';
import { CourseCreateSchema } from '@/lib/validators/course';
import { createCourse, listCourses } from '@/lib/db/courses';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/courses - List all courses
 */
async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const programId = searchParams.get('program_id') || undefined;

    const data = await listCourses({ status, programId });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to list courses' }, { status: 500 });
  }
}

/**
 * POST /api/courses - Create a new course
 */
async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Auth check
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin or Instructor required' }, { status: 403 });
    }

    // Validate input
    const body = await request.json().catch(() => null);
    const parsed = CourseCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Create course
    const data = await createCourse(parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/courses', _GET);
export const POST = withApiAudit('/api/courses', _POST);
