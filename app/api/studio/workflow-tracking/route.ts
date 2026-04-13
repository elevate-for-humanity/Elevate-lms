// PUBLIC ROUTE: studio workflow tracking — auth inside handler
import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';

import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

// Get workflow tracking data for user
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');
  const repoId = req.nextUrl.searchParams.get('repo_id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
  }

  try {
    const supabase = await getAdminClient();
    
    let query = supabase
      .from('studio_workflow_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (repoId) {
      query = query.eq('repo_id', repoId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    logger.error('Workflow tracking GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow tracking data' },
      { status: 500 }
    );
  }
}

// Create or update workflow tracking
async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
  }

  try {
    const { repo_id, workflow_id, last_run_id, last_status, notifications_enabled } = await req.json();

    if (!repo_id || !workflow_id) {
      return NextResponse.json(
        { error: 'Missing repo_id or workflow_id' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Upsert tracking record
    const { data, error } = await supabase
      .from('studio_workflow_tracking')
      .upsert(
        {
          user_id: userId,
          repo_id,
          workflow_id,
          last_run_id: last_run_id ?? null,
          last_status: last_status ?? null,
          notifications_enabled: notifications_enabled ?? true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,repo_id,workflow_id',
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Workflow tracking POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save workflow tracking data' },
      { status: 500 }
    );
  }
}

// Update workflow tracking
async function _PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
  }

  try {
    const { id, last_run_id, last_status, notifications_enabled } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing tracking ID' }, { status: 400 });
    }

    const supabase = await getAdminClient();

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (last_run_id !== undefined) updates.last_run_id = last_run_id;
    if (last_status !== undefined) updates.last_status = last_status;
    if (notifications_enabled !== undefined) updates.notifications_enabled = notifications_enabled;

    const { data, error } = await supabase
      .from('studio_workflow_tracking')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Workflow tracking PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow tracking' },
      { status: 500 }
    );
  }
}

// Delete workflow tracking
async function _DELETE(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');
  const id = req.nextUrl.searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing tracking ID' }, { status: 400 });
  }

  try {
    const supabase = await getAdminClient();

    const { error } = await supabase
      .from('studio_workflow_tracking')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('Workflow tracking DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow tracking' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/studio/workflow-tracking', _GET);
export const POST = withApiAudit('/api/studio/workflow-tracking', _POST);
export const PUT = withApiAudit('/api/studio/workflow-tracking', _PUT);
export const DELETE = withApiAudit('/api/studio/workflow-tracking', _DELETE);
