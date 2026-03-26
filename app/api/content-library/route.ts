import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = supabase
      .from('content_items')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('content_type', type);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      logger.error('Content library error:', error);
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ items: data || [] });
  } catch (err) {
    logger.error('Content library API error:', err);
    return NextResponse.json({ items: [] });
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

    const body = await request.json();
    const { title, description, content_type, file_url, tags, category } = body;

    const { data, error } = await supabase
      .from('content_items')
      .insert({
        title,
        description,
        content_type,
        file_url,
        tags: tags || [],
        category,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/content-library', _GET);
export const POST = withApiAudit('/api/content-library', _POST);
