import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    await apiRequireAdmin(request);
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('workflows')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) return safeDbError(error, 'Failed to fetch workflows');
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  let auth: Awaited<ReturnType<typeof apiRequireAdmin>>;
  try {
    auth = await apiRequireAdmin(request);
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  // 1. Create the workflow row
  const { data: workflow, error: wfErr } = await db
    .from('workflows')
    .insert({
      name: body.name,
      description: body.description ?? null,
      workflow_key: body.workflow_key ?? null,
      webhook_key: body.webhook_key ?? null,
      category: body.category ?? 'operations',
      status: body.status ?? 'inactive',
      metadata: body.metadata ?? {},
    })
    .select()
    .maybeSingle();
  if (wfErr) return safeDbError(wfErr, 'Failed to create workflow');

  const workflowId = workflow!.id;

  // 2. Persist trigger
  const trigger = body.trigger ?? body.trigger_type;
  if (trigger && trigger !== 'manual') {
    const isCron = trigger === 'schedule' || trigger.startsWith('cron:');
    const cronExpr = isCron ? (body.cron_expr ?? null) : null;
    await db.from('workflow_triggers').insert({
      workflow_id: workflowId,
      trigger_type: isCron ? 'schedule' : 'event',
      event_filter: isCron ? {} : { event: trigger, program_filter: body.program_filter ?? null },
      cron_expr: cronExpr,
    });
  }

  // 3. Persist steps
  const steps: Array<{ action: string; config: unknown }> = Array.isArray(body.steps)
    ? body.steps
    : [];
  if (steps.length > 0) {
    const stepRows = steps.map((s, idx) => ({
      workflow_id: workflowId,
      action_type: s.action,
      action_config: typeof s.config === 'string'
        ? (() => { try { return JSON.parse(s.config); } catch { return { raw: s.config }; } })()
        : (s.config ?? {}),
      step_order: idx,
    }));
    await db.from('workflow_steps').insert(stepRows);
  }

  return NextResponse.json({ data: workflow }, { status: 201 });
}
