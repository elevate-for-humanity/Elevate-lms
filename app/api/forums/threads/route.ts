import { createAdminClient } from '@/lib/supabase/admin';

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
    const categoryId = searchParams.get('category_id');
    const courseId = searchParams.get('course_id');

    let query = supabase
      .from('forum_threads')
      .select(
        `
        *,
        author:profiles!author_id(full_name, email),
        posts:forum_posts(count)
      `
      )
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ threads: data });
  } catch (error) { 
    logger.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
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

    const body = await req.json();
    const { category_id, course_id, title } = body;

    if (!category_id || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error }: any = await supabase
      .from('forum_threads')
      .insert({
        category_id,
        course_id,
        author_id: user.id,
        title,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ thread: data }, { status: 201 });
  } catch (error) { 
    logger.error('Error creating thread:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/forums/threads', _GET);
export const POST = withApiAudit('/api/forums/threads', _POST);
