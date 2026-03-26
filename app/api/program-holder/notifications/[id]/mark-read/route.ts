import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL('/program-holder/notifications', req.url)
  );
}
export const POST = withApiAudit('/api/program-holder/notifications/[id]/mark-read', _POST);
