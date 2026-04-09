import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';

import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

// Get PR tracking data for user
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
      .from('studio_pr_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (repoId) {
      query = query.eq('repo_id', repoId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    logger.error('PR tracking GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PR tracking data' },
      { status: 500 }
    );
  }
}

// Create or update PR tracking
async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
  }

  try {
    const { repo_id, pr_number, is_watching, notes } = await req.json();

    if (!repo_id || !pr_number) {
      return NextResponse.json(
        { error: 'Missing repo_id or pr_number' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Upsert tracking record
    const { data, error } = await supabase
      .from('studio_pr_tracking')
      .upsert(
        {
          user_id: userId,
          repo_id,
          pr_number,
          is_watching: is_watching ?? false,
          notes: notes ?? null,
          last_viewed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,repo_id,pr_number',
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    logger.error('PR tracking POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save PR tracking data' },
      { status: 500 }
    );
  }
}

// Update PR tracking (notes, watching status)
async function _PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
  }

  try {
    const { id, is_watching, notes, last_viewed_at } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing tracking ID' }, { status: 400 });
    }

    const supabase = await getAdminClient();

    const updates: Record<string, any> = {};
    if (is_watching !== undefined) updates.is_watching = is_watching;
    if (notes !== undefined) updates.notes = notes;
    if (last_viewed_at) updates.last_viewed_at = last_viewed_at;

    const { data, error } = await supabase
      .from('studio_pr_tracking')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    logger.error('PR tracking PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update PR tracking' },
      { status: 500 }
    );
  }
}

// Delete PR tracking
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
      .from('studio_pr_tracking')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('PR tracking DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete PR tracking' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/studio/pr-tracking', _GET);
export const POST = withApiAudit('/api/studio/pr-tracking', _POST);
export const PUT = withApiAudit('/api/studio/pr-tracking', _PUT);
export const DELETE = withApiAudit('/api/studio/pr-tracking', _DELETE);
