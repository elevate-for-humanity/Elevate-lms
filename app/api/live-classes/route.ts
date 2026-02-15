export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: NextRequest) {
  try {
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
  } catch (error) { /* Error handled silently */ 
    logger.error('Error fetching live classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live classes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
  } catch (error) { /* Error handled silently */ 
    logger.error('Error creating live class:', error);
    return NextResponse.json(
      { error: 'Failed to create live class' },
      { status: 500 }
    );
  }
}
