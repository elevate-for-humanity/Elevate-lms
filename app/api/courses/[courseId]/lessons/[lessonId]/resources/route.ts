import { createClient } from '@/lib/supabase/server';

import { NextResponse } from 'next/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getCurrentUser } from '@/lib/auth';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();
      const { lessonId } = await params;

    try {
      await assertLessonAccess(user.id, lessonId);
    } catch (e) {
      const { status, body } = accessErrorResponse(e);
      return NextResponse.json(body, { status });
    }

    const { data: resources, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ resources: resources || [] });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/courses/[courseId]/lessons/[lessonId]/resources', _GET);
