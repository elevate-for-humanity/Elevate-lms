/**
 * POST /api/devstudio/snapshot/[id]/rollback
 *
 * Execute rollback for a snapshot. Runs rollback_sql if present,
 * marks the snapshot as rolled_back, emits a rollback event.
 *
 * Requires deployer-tier confirmation — only admin can trigger.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { emitEvent } from '@/lib/platform/events';
import { requireTypedConfirmation } from '@/lib/security/require-confirmation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const { id } = await params;

  // Typed confirmation required — body must contain { confirmation: 'CONFIRM ROLLBACK' }
  let body: { confirmation?: string } = {};
  try { body = await req.json(); } catch { /* no body is fine — will fail confirmation check */ }

  const confirmed = requireTypedConfirmation(body.confirmation, 'rollback');
  if (!confirmed.ok) {
    return NextResponse.json(
      { error: `Type "${confirmed.required}" to confirm rollback`, required: confirmed.required },
      { status: 422 },
    );
  }

  try {
    const supabase = createAdminClient();

    // Fetch snapshot
    const { data: snapshot, error: fetchErr } = await supabase
      .from('platform_snapshots')
      .select('id, label, rollback_sql, rolled_back, snapshot_type')
      .eq('id', id)
      .single();

    if (fetchErr || !snapshot) return safeError('Snapshot not found', 404);
    if (snapshot.rolled_back) return safeError('Snapshot already rolled back', 409);

    // Execute rollback SQL if present
    if (snapshot.rollback_sql) {
      const dangerous = /\b(DROP\s+TABLE|TRUNCATE)\b/i.test(snapshot.rollback_sql);
      if (dangerous) {
        return safeError('Rollback SQL contains destructive statements — execute manually in Supabase Dashboard', 422);
      }

      const { error: sqlErr } = await supabase.rpc('exec_sql', { sql: snapshot.rollback_sql });
      if (sqlErr) return safeError(`Rollback SQL failed: ${sqlErr.message}`, 500);
    }

    // Mark as rolled back
    await supabase
      .from('platform_snapshots')
      .update({ rolled_back: true, rolled_back_at: new Date().toISOString() })
      .eq('id', id);

    await emitEvent('snapshot.rolled_back', 'system', {
      severity: 'warning',
      actor_id: auth.id,
      actor_type: 'ai',
      subject_id: id,
      subject_type: 'snapshot',
      message: `Rollback executed: ${snapshot.label}`,
    });

    return NextResponse.json({
      success: true,
      message: `Rollback executed for: ${snapshot.label}`,
      had_sql: !!snapshot.rollback_sql,
    });
  } catch (err) {
    return safeInternalError(err, 'Rollback failed');
  }
}
