import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// GET /api/events
async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'published';
    const upcomingOnly = searchParams.get('upcoming') === 'true';
    const eventType = searchParams.get('event_type');

    let query = db
      .from('community_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (upcomingOnly) {
      query = query.gte('created_at', new Date().toISOString());
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ events: data });
  } catch (err: any) {
    logger.error(
      'GET /events error',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events (admin-only via RBAC/RLS)
async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const body = await req.json();

    const {
      title,
      description,
      event_type,
      location_type,
      location_address,
      virtual_link,
      start_at,
      end_at,
      capacity,
      allow_waitlist,
    } = body;

    if (!title || !start_at || !end_at) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start_at, end_at' },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error }: any = await db
      .from('events')
      .insert({
        title,
        description,
        event_type,
        location_type,
        location_address,
        virtual_link,
        start_at,
        end_at,
        capacity,
        allow_waitlist,
        created_by: user?.id ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (err: any) {
    logger.error(
      'POST /events error',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/events', _GET);
export const POST = withApiAudit('/api/events', _POST);
