
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try { await apiRequireAdmin(request); }
  catch (e) { if (e instanceof Response) return e; return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  try {
    const supabase = await getAdminClient();
    const { data, error } = await supabase
      .from('studio_workspaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[workspace] List error:', error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try { await apiRequireAdmin(request); }
  catch (e) { if (e instanceof Response) return e; return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  try {
    const body = await request.json();
    const { name, description, repoUrl } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = await getAdminClient();
    const { data, error } = await supabase
      .from('studio_workspaces')
      .insert({
        name,
        description: description || null,
        repo_url: repoUrl || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      logger.error('[workspace] Create error:', error);
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
