import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch all published blog posts
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('published', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (category && category !== 'All Posts') {
      query = query.eq('category', category);
    }
    
    const { data: posts, error, count } = await query;
    
    if (error) {
      logger.error('Blog fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
    
    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    });
  } catch (error) {
    logger.error('Blog API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    
    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { title, content, excerpt, category, image, tags, status } = body;
    
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }
    
    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
    
    // Calculate reading time
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    const adminClient = createAdminClient();
    const { data: post, error } = await adminClient
      .from('blog_posts')
      .insert({
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category: category || 'News',
        image: image || '/images/blog/default.jpg',
        tags: tags || [],
        status: status || 'draft',
        author_id: user.id,
        author_name: profile.full_name || 'Elevate Team',
        reading_time: readingTime,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Blog create error:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, post });
  } catch (error) {
    logger.error('Blog POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
