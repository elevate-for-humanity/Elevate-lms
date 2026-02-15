export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    const { data: notes, error } = await query;

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ notes });
  } catch (error) { /* Error handled silently */ 
    logger.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { courseId, lessonId, content, timestamp } = body;

    if (!courseId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        course_id: courseId,
        lesson_id: lessonId,
        content,
        timestamp,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error) { /* Error handled silently */ 
    logger.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
