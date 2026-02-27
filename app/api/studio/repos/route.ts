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
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('studio_repos')
    .select('*')
    .eq('user_id', userId)
    .order('last_accessed_at', { ascending: false });

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

  const { repo_full_name, default_branch } = await req.json();
  if (!repo_full_name) {
    return NextResponse.json({ error: 'repo_full_name required' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('studio_repos')
    .upsert({
      user_id: userId,
      repo_full_name,
      default_branch: default_branch || 'main',
      last_accessed_at: new Date().toISOString()
    }, { onConflict: 'user_id,repo_full_name' })
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

  const { repo_id } = await req.json();
  if (!repo_id) {
    return NextResponse.json({ error: 'repo_id required' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { error } = await supabase
    .from('studio_repos')
    .delete()
    .eq('id', repo_id)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
export const GET = withApiAudit('/api/studio/repos', _GET);
export const POST = withApiAudit('/api/studio/repos', _POST);
export const DELETE = withApiAudit('/api/studio/repos', _DELETE);
