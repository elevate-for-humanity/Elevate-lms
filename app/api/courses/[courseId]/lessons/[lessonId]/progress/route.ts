import { createClient } from '@/lib/supabase/server';

import { NextResponse } from 'next/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
      const { lessonId } = await params;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await assertLessonAccess(user.id, lessonId);
    } catch (e) {
      const { status, body } = accessErrorResponse(e);
      return NextResponse.json(body, { status });
    }

    const { progress } = await request.json();

    const { error } = await supabase.from('video_progress').upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        progress_seconds: progress,
        last_watched: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/courses/[courseId]/lessons/[lessonId]/progress', _POST);
