import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimitNew as rateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Rate limit: 60 requests per minute
    const identifier = getClientIdentifier(request.headers);
    const rateLimitResult = rateLimit(identifier, { limit: 60, windowMs: 60000 });
    
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const slug = searchParams.get('slug');

    const supabase = createAdminClient();

    // If slug is provided, get single post
    if (slug) {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error || !post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ post });
    }

    // Build query for multiple posts
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      logger.error('Blog fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    logger.error('Blog API error:', err);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
