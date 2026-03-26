import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// GET /api/marketing/campaigns
async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('marketing_campaigns')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      campaigns: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    logger.error(
      'GET /marketing/campaigns error',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/marketing/campaigns
async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await req.json();

    const {
      name,
      subject,
      from_name,
      from_email,
      html_body,
      text_body,
      scheduled_at,
      target_segment,
    } = body;

    if (!name || !subject || !from_name || !from_email || !html_body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error }: any = await supabase
      .from('marketing_campaigns')
      .insert({
        name,
        subject,
        from_name,
        from_email,
        html_body,
        text_body,
        scheduled_at,
        target_segment,
        created_by: user?.id ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign: data }, { status: 201 });
  } catch (err: any) {
    logger.error(
      'POST /marketing/campaigns error',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/marketing/campaigns', _GET);
export const POST = withApiAudit('/api/marketing/campaigns', _POST);
