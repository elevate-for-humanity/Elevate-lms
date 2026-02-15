import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Start course progress tracking
 * POST /api/lms/progress/start
 * Body: { courseId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // Get course details
    const { data: course } = await supabase
      .from('courses')
      .select('slug')
      .eq('id', courseId)
      .single();

    // Upsert progress record
    const { error } = await supabase.from('lms_progress').upsert(
      {
        user_id: user.id,
        course_id: courseId,
        course_slug: course?.slug,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,course_id',
      }
    );

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : String(error)) ||
          'Failed to start course progress',
      },
      { status: 500 }
    );
  }
}
