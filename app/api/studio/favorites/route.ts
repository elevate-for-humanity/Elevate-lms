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
    .from('studio_favorites')
    .select('*, studio_repos(repo_full_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (repoId) {
    query = query.eq('repo_id', repoId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { repo_id, file_path, line_number, label } = await req.json();
  if (!repo_id || !file_path) {
    return NextResponse.json({ error: 'repo_id and file_path required' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('studio_favorites')
    .upsert({
      user_id: userId,
      repo_id,
      file_path,
      line_number,
      label
    }, { onConflict: 'user_id,repo_id,file_path,line_number' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(data);
}

async function _DELETE(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { error } = await supabase
    .from('studio_favorites')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
export const GET = withApiAudit('/api/studio/favorites', _GET);
export const POST = withApiAudit('/api/studio/favorites', _POST);
export const DELETE = withApiAudit('/api/studio/favorites', _DELETE);
