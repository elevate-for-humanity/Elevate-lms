import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { courseId, lessonId } = await params;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase.from('lesson_progress').upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        course_id: courseId,
        completed: true,
        completed_at: new Date().toISOString(),
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
