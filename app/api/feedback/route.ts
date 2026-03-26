import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { action, type, title, description, category, pageUrl, browserInfo } = body;

    if (action === 'submit') {
      const { data, error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user?.id || null,
          feedback_type: type,
          title,
          description,
          category,
          page_url: pageUrl,
          browser_info: browserInfo,
          status: 'new',
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Feedback submission error:', error);
        return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
      }

      return NextResponse.json({ success: true, id: data?.id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    logger.error('Feedback API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    return NextResponse.json({ feedback: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/feedback', _GET);
export const POST = withApiAudit('/api/feedback', _POST);
