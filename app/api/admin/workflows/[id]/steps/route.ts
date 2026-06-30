import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const { action_type, action_config, step_order } = body;
  if (!action_type) return NextResponse.json({ error: 'action_type required' }, { status: 400 });

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('workflow_steps')
    .insert({ workflow_id: id, action_type, action_config: action_config ?? {}, step_order: step_order ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAdminAudit({ action: AdminAction.WORKFLOW_STEP_ADDED, actorId: auth.id, entityType: 'workflow_steps', entityId: data.id, metadata: { workflow_id: id, action_type, step_order }, req: request }).catch(() => {});

  return NextResponse.json({ step: data }, { status: 201 });
}
