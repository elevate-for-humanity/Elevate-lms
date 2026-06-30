import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const dynamic = 'force-dynamic';

// GET /api/admin/workflows/[id] — workflow detail with triggers, steps, recent runs
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const db = await requireAdminClient();

  const [{ data: workflow }, { data: triggers }, { data: steps }, { data: runs }] =
    await Promise.all([
      db.from('workflows').select('*').eq('id', id).single(),
      db.from('workflow_triggers').select('*').eq('workflow_id', id).order('created_at'),
      db.from('workflow_steps').select('*').eq('workflow_id', id).order('step_order'),
      db
        .from('workflow_runs')
        .select('*')
        .eq('workflow_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

  if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ workflow, triggers: triggers ?? [], steps: steps ?? [], runs: runs ?? [] });
}

// PATCH /api/admin/workflows/[id] — update status / name / metadata
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const db = await requireAdminClient();

  const allowed = ['name', 'status', 'category', 'metadata'];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await db.from('workflows').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAdminAudit({ action: AdminAction.WORKFLOW_UPDATED, actorId: auth.id, entityType: 'workflows', entityId: id, metadata: update, req: request }).catch(() => {});

  return NextResponse.json({ workflow: data });
}

// DELETE /api/admin/workflows/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const db = await requireAdminClient();
  const { error } = await db.from('workflows').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAdminAudit({ action: AdminAction.WORKFLOW_DELETED, actorId: auth.id, entityType: 'workflows', entityId: id, metadata: {}, req: request }).catch(() => {});

  return NextResponse.json({ deleted: true });
}
