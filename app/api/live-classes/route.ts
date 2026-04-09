
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('course_id');
    const upcoming = searchParams.get('upcoming') === 'true';

    let query = supabase
      .from('live_classes')
      .select(
        `
        *,
        instructor:profiles!instructor_id(full_name, email),
        course:courses(title)
      `
      )
      .order('scheduled_at', { ascending: true });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (upcoming) {
      query = query.gte('scheduled_at', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ classes: data });
  } catch (error) { 
    logger.error('Error fetching live classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live classes' },
      { status: 500 }
    );
  }
}

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or instructor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'instructor'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      course_id,
      title,
      description,
      scheduled_at,
      duration_minutes,
      provider,
      meeting_url,
    } = body;

    if (!course_id || !title || !scheduled_at) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error }: any = await supabase
      .from('live_classes')
      .insert({
        course_id,
        instructor_id: user.id,
        title,
        description,
        scheduled_at,
        duration_minutes: duration_minutes || 60,
        provider: provider || 'zoom',
        meeting_url,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ class: data }, { status: 201 });
  } catch (error) { 
    logger.error('Error creating live class:', error);
    return NextResponse.json(
      { error: 'Failed to create live class' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/live-classes', _GET);
export const POST = withApiAudit('/api/live-classes', _POST);
