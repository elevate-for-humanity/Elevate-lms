export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const code = req.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'code required' }, { status: 400 });
  }

  const supabase = supabaseServer();
  
  // Get share and increment view count
  const { data, error } = await supabase
    .from('studio_shares')
    .select('*, studio_repos(repo_full_name)')
    .eq('share_code', code)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Share link expired' }, { status: 410 });
  }

  // Increment view count
  await supabase
    .from('studio_shares')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id);

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { repo_id, file_path, branch, line_start, line_end, expires_in_hours } = await req.json();
  if (!repo_id || !file_path) {
    return NextResponse.json({ error: 'repo_id and file_path required' }, { status: 400 });
  }

  const supabase = supabaseServer();
  
  const expiresAt = expires_in_hours 
    ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('studio_shares')
    .insert({
      user_id: userId,
      repo_id,
      file_path,
      branch,
      line_start,
      line_end,
      share_code: generateShareCode(),
      expires_at: expiresAt
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  
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
    .from('studio_shares')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
