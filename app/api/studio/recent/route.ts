export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');
  const repoId = req.nextUrl.searchParams.get('repo_id');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseServer();
  
  let query = db
    .from('studio_recent_files')
    .select('*, studio_repos(repo_full_name)')
    .eq('user_id', userId)
    .order('accessed_at', { ascending: false })
    .limit(limit);
    
  if (repoId) {
    query = query.eq('repo_id', repoId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { repo_id, file_path, branch } = await req.json();
  if (!repo_id || !file_path) {
    return NextResponse.json({ error: 'repo_id and file_path required' }, { status: 400 });
  }

  const supabase = supabaseServer();
  
  // Upsert with increment
  const { data: existing } = await db
    .from('studio_recent_files')
    .select('id, access_count')
    .eq('user_id', userId)
    .eq('repo_id', repo_id)
    .eq('file_path', file_path)
    .eq('branch', branch || '')
    .single();

  const { data, error } = await db
    .from('studio_recent_files')
    .upsert({
      id: existing?.id,
      user_id: userId,
      repo_id,
      file_path,
      branch,
      accessed_at: new Date().toISOString(),
      access_count: (existing?.access_count || 0) + 1
    }, { onConflict: 'user_id,repo_id,file_path,branch' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(data);
}
