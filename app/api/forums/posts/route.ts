export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('thread_id');

    if (!threadId) {
      return NextResponse.json({ error: 'Missing thread_id' }, { status: 400 });
    }

    const { data, error }: any = await supabase
      .from('forum_posts')
      .select(
        `
        *,
        author:profiles!author_id(full_name, email)
      `
      )
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Increment thread views
    await supabase.rpc('increment_thread_views', { thread_id: threadId });

    return NextResponse.json({ posts: data });
  } catch (error) { 
    logger.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
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

    const body = await req.json();
    const { thread_id, content } = body;

    if (!thread_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error }: any = await supabase
      .from('forum_posts')
      .insert({
        thread_id,
        author_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    // Update thread updated_at
    await supabase
      .from('forum_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', thread_id);

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error) { 
    logger.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
