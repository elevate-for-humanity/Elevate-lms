import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
import { resolveCoursePreview } from '@/lib/admin/course-preview';
import { signedLessonPlayback } from '@/lib/storage/lesson-playback';
import { renderMediaUrl } from '@/lib/ultimate-course-builder/media/playback-source.mjs';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

export async function GET(_request: Request, { params }: { params: Promise<{courseId: string; lessonId: string}> }) {
  const {courseId, lessonId} = await params;
  try {
    const preview = await resolveCoursePreview(courseId);
    const user = await getCurrentUser();
    if (!preview.active && !user) return NextResponse.json({error:'Unauthorized'}, {status:401, headers});
    const limited = await applyRateLimit(_request, 'api', { key: `lesson-playback:${user?.id || `preview:${courseId}`}` });
    if (limited) {
      for (const [key, value] of Object.entries(headers)) limited.headers.set(key, value);
      return limited;
    }
    if (!preview.active) {
      try { await assertLessonAccess(user!.id, lessonId); }
      catch(error) { const denied = accessErrorResponse(error); return NextResponse.json(denied.body, {status:denied.status, headers}); }
    }
    const db = preview.active ? preview.db : await requireAdminClient();
    let query = db.from('course_lessons').select('video_url,content_json').eq('course_id', courseId).eq('id', lessonId);
    if (!preview.active) query = query.eq('is_published', true);
    const {data:lesson,error} = await query.maybeSingle();
    if (error) throw error;
    if (!lesson) return NextResponse.json({error:'Lesson not found'}, {status:404, headers});
    const source = renderMediaUrl(lesson.content_json?.film) || lesson.video_url;
    if (!source) return NextResponse.json({error:'Video unavailable'}, {status:404, headers});
    const location = await signedLessonPlayback(db, source);
    return new NextResponse(null, {status:307, headers:{...headers, Location:location}});
  } catch {
    return NextResponse.json({error:'Video delivery unavailable'}, {status:503, headers});
  }
}
