
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, title, body } = await req.json();

    if (!courseId || !title || !body) {
      return NextResponse.json(
        { error: 'courseId, title, and body are required' },
        { status: 400 },
      );
    }

    const { data: thread, error } = await supabase
      .from('discussion_threads')
      .insert({
        course_id: courseId,
        title,
        body,
        author_id: user.id,
      })
      .select('*, replies:discussion_replies(*)')
      .single();

    if (error) {
      logger.error('Discussion thread error:', error);
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
    }

    // Simple gamification: award "first post" badge
    const { data: badge } = await supabase
      .from('badges')
      .select('*')
      .eq('slug', 'first-post')
      .single();

    if (badge) {
      await supabase.from('user_badges').upsert(
        {
          user_id: user.id,
          badge_id: badge.id,
        },
        { onConflict: 'user_id,badge_id' }
      );
    }

    return NextResponse.json({ thread });
  } catch (error) { 
    logger.error('Discussion API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/discussions/thread', _POST);
