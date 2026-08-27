import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { generateScormPackage, type ScormFormat } from '@/lib/scorm/course-package';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const courseId = request.nextUrl.searchParams.get('courseId')?.trim();
  const requestedFormat = request.nextUrl.searchParams.get('format');
  const format: ScormFormat = requestedFormat === '2004' ? '2004' : '1.2';

  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  try {
    const db = await requireAdminClient();
    const [{ data: course, error: courseError }, { data: lessons, error: lessonError }] =
      await Promise.all([
        db.from('training_courses').select('id, title, course_name').eq('id', courseId).single(),
        db
          .from('training_lessons')
          .select('lesson_number, title, content, video_url, quiz_questions')
          .eq('course_id', courseId)
          .order('lesson_number'),
      ]);

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    if (lessonError) throw lessonError;
    if (!lessons?.length) {
      return NextResponse.json({ error: 'Course has no lessons to export' }, { status: 422 });
    }

    const title = course.title || course.course_name || `Course ${courseId}`;
    const pkg = generateScormPackage({ courseId, title, lessons, format });

    return new Response(new Uint8Array(pkg.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${pkg.filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    logger.error('[course-builder/scorm-export] Export failed', error);
    return NextResponse.json({ error: 'Unable to generate SCORM package' }, { status: 500 });
  }
}
