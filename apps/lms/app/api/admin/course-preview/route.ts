import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { verifyPortalPreviewHandoff } from '@/lib/admin/portal-preview-handoff';
import { COURSE_PREVIEW_COOKIE } from '@/lib/admin/course-preview';

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff']);
const LMS_URL = (process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org').replace(
  /\/$/,
  '',
);

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('handoff') || '';
  const handoff = verifyPortalPreviewHandoff(token);
  if (!handoff) return NextResponse.json({ error: 'Invalid preview handoff' }, { status: 403 });
  const db = await requireAdminClient();
  const [{ data: actor }, { data: course }, { data: videoLesson }, { data: firstLesson }] = await Promise.all([
    db.from('profiles').select('role').eq('id', handoff.actorId).maybeSingle(),
    db.from('courses').select('id').eq('id', handoff.targetId).maybeSingle(),
    db
      .from('course_lessons')
      .select('id')
      .eq('course_id', handoff.targetId)
      .not('video_url', 'is', null)
      .order('order_index')
      .limit(1)
      .maybeSingle(),
    db
      .from('course_lessons')
      .select('id')
      .eq('course_id', handoff.targetId)
      .order('order_index')
      .limit(1)
      .maybeSingle(),
  ]);
  if (!course || !ADMIN_ROLES.has(String(actor?.role || ''))) return NextResponse.json({ error: 'Preview denied' }, { status: 403 });
  const openingLesson = videoLesson ?? firstLesson;
  const destination = openingLesson
    ? `/lms/courses/${course.id}/lessons/${openingLesson.id}`
    : `/lms/courses/${course.id}`;
  const response = NextResponse.redirect(new URL(destination, LMS_URL));
  response.cookies.set(COURSE_PREVIEW_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 60, path: '/' });
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
