import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getInstructorForCourse } from '@/lib/ai-instructors';
import { queueCourseLessonVideos } from '@/lib/course-builder/video-queue';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function loadCourse(courseId: string) {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('courses')
    .select('id,title,slug')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const courseId = req.nextUrl.searchParams.get('courseId');
  if (!courseId) return safeError('courseId is required', 400);

  try {
    const course = await loadCourse(courseId);
    if (!course) return safeError('Course not found', 404);
    return NextResponse.json({
      ok: true,
      course,
      instructor: getInstructorForCourse(course.title),
    });
  } catch (error) {
    return safeInternalError(error, 'Unable to load the course instructor');
  }
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    if (!body.courseId) return safeError('courseId is required', 400);
    const course = await loadCourse(body.courseId);
    if (!course) return safeError('Course not found', 404);
    const result = await queueCourseLessonVideos({
      courseId: body.courseId,
      onlyMissing: body.onlyMissing !== false,
      force: body.force === true,
      limit: typeof body.limit === 'number' ? body.limit : null,
    });
    return NextResponse.json({
      ok: result.failed === 0,
      course,
      instructor: getInstructorForCourse(course.title),
      result,
    });
  } catch (error) {
    return safeInternalError(error, 'Unable to queue instructor-led lesson videos');
  }
}
