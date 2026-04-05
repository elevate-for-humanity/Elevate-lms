
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try { await apiRequireAdmin(request); }
  catch (e) { if (e instanceof Response) return e; return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const { id } = await params;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('studio_workspaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try { await apiRequireAdmin(request); }
  catch (e) { if (e instanceof Response) return e; return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const { id } = await params;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('studio_workspaces')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('[workspace] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
  }
}
