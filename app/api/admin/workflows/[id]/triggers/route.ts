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
  const { trigger_type, event_filter, cron_expr } = body;
  if (!trigger_type) return NextResponse.json({ error: 'trigger_type required' }, { status: 400 });

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('workflow_triggers')
    .insert({ workflow_id: id, trigger_type, event_filter: event_filter ?? {}, cron_expr: cron_expr ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAdminAudit({ action: AdminAction.WORKFLOW_TRIGGER_ADDED, actorId: auth.id, entityType: 'workflow_triggers', entityId: data.id, metadata: { workflow_id: id, trigger_type, cron_expr }, req: request }).catch(() => {});

  return NextResponse.json({ trigger: data }, { status: 201 });
}
