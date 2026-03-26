
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workspace/[id] — get a single workspace
 * DELETE /api/workspace/[id] — delete a workspace
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
