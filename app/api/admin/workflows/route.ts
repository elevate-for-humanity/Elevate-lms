import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const dynamic = 'force-dynamic';

// GET /api/admin/workflows — list workflows with trigger + step counts and recent run
export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();

  const { data: workflows, error } = await db
    .from('workflows')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with trigger + step counts
  const ids = (workflows ?? []).map((w: any) => w.id);
  const [{ data: triggers }, { data: steps }] = await Promise.all([
    ids.length
      ? db.from('workflow_triggers').select('workflow_id').in('workflow_id', ids)
      : { data: [] },
    ids.length
      ? db.from('workflow_steps').select('workflow_id').in('workflow_id', ids)
      : { data: [] },
  ]);

  const triggerCounts = (triggers ?? []).reduce((acc: Record<string, number>, t: any) => {
    acc[t.workflow_id] = (acc[t.workflow_id] ?? 0) + 1;
    return acc;
  }, {});
  const stepCounts = (steps ?? []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.workflow_id] = (acc[s.workflow_id] ?? 0) + 1;
    return acc;
  }, {});

  const enriched = (workflows ?? []).map((w: any) => ({
    ...w,
    trigger_count: triggerCounts[w.id] ?? 0,
    step_count: stepCounts[w.id] ?? 0,
  }));

  return NextResponse.json({ workflows: enriched });
}

// POST /api/admin/workflows — create a new workflow
export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { name, category, metadata } = body;
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const db = await requireAdminClient();
  const workflow_key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const { data, error } = await db
    .from('workflows')
    .insert({ name, workflow_key, category: category ?? 'system', status: 'inactive', metadata: metadata ?? {} })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAdminAudit({ action: AdminAction.WORKFLOW_CREATED, actorId: auth.id, entityType: 'workflows', entityId: data.id, metadata: { name, category }, req: request }).catch(() => {});

  return NextResponse.json({ workflow: data }, { status: 201 });
}
