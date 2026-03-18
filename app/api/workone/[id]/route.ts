export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = createAdminClient();

  const { data: row, error: rowErr } = await adminClient
    .from('workone_checklist')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle();

  if (rowErr || !row) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  // Students can only update their own rows; admins/staff can update any
  if (row.user_id !== user.id) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const adminRoles = ['admin', 'super_admin', 'staff'];
    if (!profile || !adminRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const patch = (await req.json()) as {
    status?: 'todo' | 'in_progress' | 'done';
    notes?: string | null;
    due_date?: string | null;
  };

  const next: Record<string, unknown> = {};
  if (patch.status)        next.status = patch.status;
  if ('notes' in patch)    next.notes = patch.notes;
  if ('due_date' in patch) next.due_date = patch.due_date;

  if (patch.status === 'done')  next.completed_at = new Date().toISOString();
  if (patch.status && patch.status !== 'done') next.completed_at = null;

  const { error: updErr } = await adminClient
    .from('workone_checklist')
    .update(next)
    .eq('id', id);

  if (updErr) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export const PATCH = withApiAudit('/api/workone/[id]', _PATCH);
