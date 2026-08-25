import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BARBER_COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const STORAGE_MARKER = '/storage/v1/object/public/course-videos/';
const ALLOWED_PREFIX = 'barber/';

function barberStoragePath(value: string): string | null {
  try {
    const pathname = new URL(value).pathname;
    const index = pathname.indexOf(STORAGE_MARKER);
    if (index < 0) return null;
    const path = decodeURIComponent(pathname.slice(index + STORAGE_MARKER.length));
    return path.startsWith(ALLOWED_PREFIX) ? path : null;
  } catch {
    return null;
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data: lessons, error } = await db
    .from('course_lessons')
    .select('id,video_url')
    .eq('course_id', BARBER_COURSE_ID)
    .not('video_url', 'is', null);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const targets = (lessons ?? [])
    .map((lesson) => ({ id: lesson.id, path: barberStoragePath(String(lesson.video_url ?? '')) }))
    .filter((item): item is { id: string; path: string } => Boolean(item.path));
  const paths = [...new Set(targets.map((item) => item.path))];
  if (!paths.length) return NextResponse.json({ ok: true, deleted: 0, clearedLessons: 0 });

  const { error: removeError } = await db.storage.from('course-videos').remove(paths);
  if (removeError) {
    return NextResponse.json({ ok: false, error: 'Storage removal failed' }, { status: 500 });
  }

  const lessonIds = targets.map((item) => item.id);
  const { error: clearError } = await db
    .from('course_lessons')
    .update({ video_url: null, video_status: 'queued', video_error: null })
    .in('id', lessonIds)
    .eq('course_id', BARBER_COURSE_ID);
  if (clearError) {
    return NextResponse.json(
      { ok: false, error: 'Lesson cleanup failed', deleted: paths.length },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, deleted: paths.length, clearedLessons: lessonIds.length });
}
