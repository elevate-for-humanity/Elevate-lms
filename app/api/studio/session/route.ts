export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');
  const repoId = req.nextUrl.searchParams.get('repo_id');
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseServer();
  
  let query = supabase
    .from('studio_sessions')
    .select('*')
    .eq('user_id', userId);
    
  if (repoId) {
    query = query.eq('repo_id', repoId);
  }

  const { data, error } = await query.order('updated_at', { ascending: false }).limit(1).single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(data || null);
}

async function _PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { repo_id, branch, open_files, active_file, cursor_positions } = body;

  if (!repo_id) {
    return NextResponse.json({ error: 'repo_id required' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('studio_sessions')
    .upsert({
      user_id: userId,
      repo_id,
      branch,
      open_files: open_files || [],
      active_file,
      cursor_positions: cursor_positions || {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,repo_id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(data);
}
export const GET = withApiAudit('/api/studio/session', _GET);
export const PUT = withApiAudit('/api/studio/session', _PUT);
