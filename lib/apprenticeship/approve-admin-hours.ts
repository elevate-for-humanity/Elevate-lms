import 'server-only';
import type { HoursApprovalSnapshot } from './admin-hours-model';
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeDbError, safeError } from '@/lib/api/safe-error';

export const HOURS_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function approveAdminHours(
  ids: string[],
  actorId: string,
  expected: HoursApprovalSnapshot[],
) {
  const db = await requireAdminClient();
  const { data: count, error } = await db.rpc('admin_verify_apprenticeship_hours', {
    p_ids: ids,
    p_approver_id: actorId,
    p_expected: expected,
  });
  if (error) {
    if (error.code === '42501') return safeError('Admin approval permission is required', 403);
    if (['P0001', '23514', '22023'].includes(error.code))
      return safeError(
        'Hours need review or have changed. Refresh the queue before approving again.',
        409,
      );
    return safeDbError(error, 'Approve apprenticeship hours');
  }
  const { data: verified, error: readError } = await db
    .from('progress_entries')
    .select('id,status,verified_by,verified_at')
    .in('id', ids);
  if (readError)
    return safeDbError(
      readError,
      'Read approval results',
      'Approval saved, but confirmation could not load. Refresh the queue.',
    );
  if (
    verified?.length !== ids.length ||
    verified.some((e) => e.status !== 'verified' || !e.verified_by || !e.verified_at)
  )
    return safeError('Could not confirm every approval. Refresh the queue before retrying.', 409);
  return NextResponse.json({ ok: true, approvedCount: Number(count), entries: verified });
}

export function validHoursSnapshots(
  ids: string[],
  expected: unknown,
): expected is HoursApprovalSnapshot[] {
  return (
    Array.isArray(expected) &&
    expected.length === ids.length &&
    new Set(expected.map((e) => e?.id)).size === ids.length &&
    expected.every(
      (e) =>
        e &&
        ids.includes(e.id) &&
        typeof e.hours_worked === 'number' &&
        Number.isFinite(e.hours_worked) &&
        typeof e.work_date === 'string' &&
        typeof e.apprentice_id === 'string' &&
        typeof e.program_id === 'string',
    )
  );
}
