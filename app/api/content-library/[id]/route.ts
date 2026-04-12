// Single content item operations for the Content Library admin UI.
// DELETE removes the item (soft-delete via is_active=false).
// Requires admin, super_admin, or staff role.
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('content_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      logger.error('Content item delete error:', error);
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Content library delete handler error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
