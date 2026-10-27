import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createPortalPreviewHandoff } from '@/lib/admin/portal-preview-handoff';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LMS_URL = (process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org').replace(
  /\/$/,
  '',
);

/**
 * Opens the real LMS course experience in read-only draft-preview mode.
 *
 * The LMS owns lesson rendering and video playback. Course Builder only issues
 * the short-lived, signed handoff that lets an authenticated administrator see
 * unpublished course records without creating a second learner implementation.
 */
export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const courseId = request.nextUrl.searchParams.get('courseId')?.trim() || '';
  const lessonId = request.nextUrl.searchParams.get('lessonId')?.trim() || '';
  if (!UUID.test(courseId)) {
    return NextResponse.json({ error: 'Valid courseId required' }, { status: 400 });
  }
  if (lessonId && !UUID.test(lessonId)) {
    return NextResponse.json({ error: 'Valid lessonId required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const [{ data: course, error }, { data: lesson, error: lessonError }] = await Promise.all([
    db
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .maybeSingle(),
    lessonId
      ? db
          .from('course_lessons')
          .select('id')
          .eq('id', lessonId)
          .eq('course_id', courseId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (error || lessonError) {
    logger.error('Course Builder learner preview lookup failed', error ?? lessonError);
    return NextResponse.json({ error: 'Unable to open learner preview' }, { status: 500 });
  }
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  if (lessonId && !lesson)
    return NextResponse.json({ error: 'Lesson not found in selected course' }, { status: 404 });

  const previewUrl = new URL('/api/admin/course-preview', LMS_URL);
  previewUrl.searchParams.set('handoff', createPortalPreviewHandoff(auth.id, course.id));
  if (lessonId) previewUrl.searchParams.set('lessonId', lessonId);

  const response = NextResponse.redirect(previewUrl);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}
