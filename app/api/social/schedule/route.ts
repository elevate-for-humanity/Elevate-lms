import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, getAdminClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Social Media Post Scheduler
 * Stores scheduled posts in database for later publishing via cron/webhook
 */

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const adminClient = await getAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
    const { data: posts, error } = await adminClient
      .from('social_posts')
      .select('*')
      .order('scheduled_at', { ascending: true });
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
    
    return NextResponse.json({ posts: posts || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { content, platforms, scheduled_at, blog_post_id, image_url } = body;
    
    if (!content || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'Content and platforms are required' }, { status: 400 });
    }
    
    const adminClient = await getAdminClient();
    const { data: post, error } = await adminClient
      .from('social_posts')
      .insert({
        content,
        platforms, // ['facebook', 'twitter', 'linkedin', 'instagram']
        scheduled_at: scheduled_at || new Date().toISOString(),
        blog_post_id,
        image_url,
        status: 'scheduled',
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Social post create error:', error);
      return NextResponse.json({ error: 'Failed to schedule post' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, post });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/social/schedule', _GET);
export const POST = withApiAudit('/api/social/schedule', _POST);
