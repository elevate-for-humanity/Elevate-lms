import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createPortalPreviewHandoff } from '@/lib/admin/portal-preview-handoff';
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
  if (!UUID.test(courseId)) {
    return NextResponse.json({ error: 'Valid courseId required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const { data: course, error } = await db
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: 'Unable to open learner preview', details: error.message },
      { status: 500 },
    );
  }
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  const previewUrl = new URL('/api/admin/course-preview', LMS_URL);
  previewUrl.searchParams.set('handoff', createPortalPreviewHandoff(auth.id, course.id));

  const response = NextResponse.redirect(previewUrl);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}
