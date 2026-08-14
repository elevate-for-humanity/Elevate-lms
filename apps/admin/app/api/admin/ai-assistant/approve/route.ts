export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { executeEllieAction } from '@/lib/ellie/executor';
import type { EllieActionType } from '@/lib/ellie/actions';

// POST /api/admin/ai-assistant/approve
// Body: { actionId: string, decision: 'approve' | 'reject' }
//
// Flow:
//   1. Load the pending action row (must belong to the requesting admin)
//   2. If rejected — mark rejected, return
//   3. If approved — execute, write audit_log, mark executed
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const { actionId, decision } = body as { actionId?: string; decision?: 'approve' | 'reject' };

  if (!actionId) {
    return NextResponse.json({ error: 'actionId is required' }, { status: 400 });
  }
  if (decision !== 'approve' && decision !== 'reject') {
    return NextResponse.json({ error: 'decision must be "approve" or "reject"' }, { status: 400 });
  }

  const db = await requireAdminClient();

  // Load the pending action — RLS ensures it belongs to this user
  const { data: pending, error: loadError } = await db
    .from('ellie_pending_actions')
    .select('*')
    .eq('id', actionId)
    .eq('requested_by', auth.id)
    .eq('status', 'pending')
    .single();

  if (loadError || !pending) {
    return NextResponse.json(
      { error: 'Action not found, already resolved, or not yours.' },
      { status: 404 },
    );
  }

  // Check expiry — pending actions expire after 30 minutes
  const age = Date.now() - new Date(pending.created_at as string).getTime();
  if (age > 30 * 60 * 1000) {
    await db
      .from('ellie_pending_actions')
      .update({ status: 'rejected', resolved_at: new Date().toISOString(), result: { reason: 'expired' } })
      .eq('id', actionId);
    return NextResponse.json({ error: 'Action expired (>30 min). Ask Ellie again.' }, { status: 410 });
  }

  // ── Rejection path ────────────────────────────────────────────────────────
  if (decision === 'reject') {
    await db
      .from('ellie_pending_actions')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', actionId);

    await writeAuditLog(db, auth.id, pending.action_type as string, pending.params as Record<string, unknown>, { cancelled: true }, 'rejected');

    return NextResponse.json({ ok: true, status: 'rejected' });
  }

  // ── Approval + execution path ─────────────────────────────────────────────
  await db
    .from('ellie_pending_actions')
    .update({ status: 'approved', resolved_at: new Date().toISOString() })
    .eq('id', actionId);

  let result;
  try {
    result = await executeEllieAction(
      pending.action_type as EllieActionType,
      pending.params as Record<string, unknown>,
      db,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown execution error';
    await db
      .from('ellie_pending_actions')
      .update({ status: 'failed', result: { error: message } })
      .eq('id', actionId);

    await writeAuditLog(db, auth.id, pending.action_type as string, pending.params as Record<string, unknown>, { error: message }, 'failed');

    return NextResponse.json({ error: message }, { status: 500 });
  }

  await db
    .from('ellie_pending_actions')
    .update({ status: 'executed', result })
    .eq('id', actionId);

  await writeAuditLog(db, auth.id, pending.action_type as string, pending.params as Record<string, unknown>, result, result.success ? 'executed' : 'failed');

  return NextResponse.json({ ok: true, status: 'executed', result });
}

async function writeAuditLog(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  userId: string,
  action: string,
  params: Record<string, unknown>,
  result: unknown,
  status: string,
) {
  // Non-fatal — audit_logs may not exist in all environments
  await db.from('audit_logs').insert({
    actor_id: userId,
    actor_type: 'admin',
    action: `ellie.${action}`,
    resource_type: 'ellie_action',
    metadata: { params, result, status, source: 'ellie' },
  }).then(() => {}, () => {});
}
