import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { HOURS_UUID_RE } from '@/lib/apprenticeship/approve-admin-hours';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIONS = ['approve', 'delete'] as const;
type ResolveAction = (typeof ACTIONS)[number];

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const body = (await req.json().catch(() => null)) as { id?: unknown; action?: unknown } | null;
  const id = typeof body?.id === 'string' ? body.id : '';
  const action = body?.action as ResolveAction;
  if (!HOURS_UUID_RE.test(id) || !ACTIONS.includes(action))
    return safeError('A progress entry and an approve or delete action are required', 400);

  try {
    const db = await requireAdminClient();
    const { data: entry, error } = await db
      .from('progress_entries')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!entry) return safeError('Entry not found. Refresh the queue.', 404);

    if (action === 'approve') {
      if (!['disputed', 'submitted', 'draft'].includes(entry.status))
        return safeError('Only pending or disputed entries can be approved', 409);
      if (entry.status !== 'submitted') {
        const { error: reopenError } = await db
          .from('progress_entries')
          .update({ status: 'submitted', updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('status', entry.status);
        if (reopenError) throw reopenError;
      }
      const { data: count, error: approveError } = await db.rpc('admin_approve_progress_entries', {
        p_ids: [id],
        p_approver_id: auth.id,
      });
      if (approveError) throw approveError;
      if (count !== 1) return safeError('The entry changed before approval. Refresh the queue.', 409);
      return NextResponse.json({ ok: true, action });
    }

    // Delete removes the clock-in and any unapproved ledger copy so the student can restart.
    const { data: ledger, error: ledgerError } = await db
      .from('hour_entries')
      .select('id,status')
      .eq('progress_entry_id', id);
    if (ledgerError) throw ledgerError;
    const { error: auditError } = await db.from('audit_logs').insert({
      action: 'apprenticeship.progress_entry.deleted',
      actor_id: auth.id,
      target_type: 'progress_entry',
      target_id: id,
      metadata: {
        apprentice_id: entry.apprentice_id,
        program_id: entry.program_id,
        hours_worked: entry.hours_worked,
        ledger_ids: (ledger ?? []).map((h) => h.id),
      },
      before_state: entry,
      after_state: null,
      created_at: new Date().toISOString(),
    });
    if (auditError) throw auditError;
    if ((ledger ?? []).length) {
      const { error: unlinkError } = await db
        .from('progress_entries')
        .update({ hour_entry_id: null })
        .eq('id', id);
      if (unlinkError) throw unlinkError;
      const { error: ledgerDeleteError } = await db
        .from('hour_entries')
        .delete()
        .eq('progress_entry_id', id);
      if (ledgerDeleteError) throw ledgerDeleteError;
    }
    const { error: deleteError } = await db.from('progress_entries').delete().eq('id', id);
    if (deleteError) throw deleteError;
    return NextResponse.json({ ok: true, action });
  } catch (error) {
    return safeInternalError(error, 'Resolve apprenticeship hours', 'Could not update the entry.');
  }
}
