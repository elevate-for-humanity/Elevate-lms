/**
 * POST /api/devstudio/snapshot
 * GET  /api/devstudio/snapshot
 *
 * Snapshot + Rollback Engine.
 *
 * POST: Create a snapshot before an AI-initiated change.
 *   Body: { type, label, data, rollback_sql? }
 *   Returns: { id, label, created_at }
 *
 * GET: List recent snapshots.
 *   Query: ?limit=20&type=pre_migration
 *
 * POST /api/devstudio/snapshot/[id]/rollback
 *   Executes rollback_sql if present, marks snapshot as rolled_back.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { emitEvent } from '@/lib/platform/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);
  const type  = searchParams.get('type');

  try {
    const supabase = createAdminClient();
    let q = supabase
      .from('platform_snapshots')
      .select('id, snapshot_type, label, trigger_type, rolled_back, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) q = q.eq('snapshot_type', type) as typeof q;

    const { data, error } = await q;
    if (error) return safeError(error.message, 500);

    return NextResponse.json({ snapshots: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to list snapshots');
  }
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { type, label, data, rollback_sql } = body;

    if (!type || !label) return safeError('type and label are required', 400);

    const supabase = createAdminClient();
    const { data: snapshot, error } = await supabase
      .from('platform_snapshots')
      .insert({
        snapshot_type: type,
        label,
        triggered_by: auth.id ?? null,
        trigger_type: 'ai',
        data: data ?? {},
        rollback_sql: rollback_sql ?? null,
      })
      .select('id, label, created_at')
      .single();

    if (error) return safeError(error.message, 500);

    await emitEvent('snapshot.created', 'system', {
      actor_id: auth.id,
      actor_type: 'ai',
      subject_id: snapshot.id,
      subject_type: 'snapshot',
      message: `Snapshot created: ${label}`,
    });

    return NextResponse.json(snapshot);
  } catch (err) {
    return safeInternalError(err, 'Failed to create snapshot');
  }
}
