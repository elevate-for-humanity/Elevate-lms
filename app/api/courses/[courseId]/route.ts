import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { courseId } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Check if courseId is a UUID or slug
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        courseId
      );

    // Get course with lessons
    const query = db.from('training_courses').select(`
        *,
        lessons (
          id,
          title,
          description,
          content,
          video_url,
          duration_minutes,
          order_index,
          is_preview
        )
      `);

    // Query by ID or slug
    const { data: course, error: courseError } = isUUID
      ? await query.eq('id', courseId).single()
      : await query.eq('slug', courseId).single();

    if (courseError) {
      return NextResponse.json({ error: 'Course operation failed' }, { status: 404 });
    }

    // Sort lessons by order_index
    if (course.lessons) {
      course.lessons.sort(
        (a: { order_index: number }, b: { order_index: number }) =>
          a.order_index - b.order_index
      );
    }

    return NextResponse.json({ course });
  } catch (error) { 
    logger.error(
      'Course fetch error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

async function _PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { courseId } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or instructor
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = await request.json();

    const { data: course, error } = await db
      .from('training_courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 400 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) { 
    logger.error(
      'Course update error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to update course' },
      { status: 500 }
    );
  }
}

async function _DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { courseId } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    const { error } = await db
      .from('training_courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error(
      'Course delete error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to delete course' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/courses/[courseId]', _GET);
export const PATCH = withApiAudit('/api/courses/[courseId]', _PATCH);
export const DELETE = withApiAudit('/api/courses/[courseId]', _DELETE);
