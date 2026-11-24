// AUTH: admin/admin only — staff cannot void payouts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

// Void (cancel) a queued partner payout. The enrollment is removed from the
// payout queue and can no longer be paid: the payout schedule is held so the
// mark-payout-paid route and the program-holder-payouts cron (which releases
// any schedule with increment_1_status 'approved') cannot release it, and
// the void is recorded in enrollment_voucher_audit with the admin's reason.
// Does not delete the enrollment or any payment history.
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  // Only admin/admin can void payouts — not staff
  const db = await requireAdminClient();
  if (!db) return safeError('Server error', 500);

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', auth.id)
    .maybeSingle();

  if (!profile || !['admin'].includes(profile.role)) {
    return safeError('Only admins can void payouts', 403);
  }

  const { enrollment_id, reason } = await request.json();
  if (!enrollment_id) return safeError('enrollment_id required', 400);
  if (typeof reason !== 'string' || !reason.trim()) {
    return safeError('A reason is required to void a payout', 400);
  }
  const voidReason = reason.trim();

  const { data: enrollment, error: fetchError } = await db
    .from('program_enrollments')
    .select('id, payout_status')
    .eq('id', enrollment_id)
    .maybeSingle();
  if (fetchError) return safeInternalError(fetchError, 'Failed to load enrollment');
  if (!enrollment) return safeError('Enrollment not found', 404);
  if (enrollment.payout_status === 'paid') {
    return safeError('This payout is already paid and cannot be voided', 409);
  }
  if (enrollment.payout_status === 'voided') {
    return safeError('This payout is already voided', 409);
  }
  if (enrollment.payout_status === 'not_triggered') {
    return safeError('This enrollment has no payout to void', 409);
  }

  // Enrollment first: if 'voided' is rejected (e.g. the migration widening
  // the payout_status CHECK has not been applied), nothing else has changed
  // and the failure surfaces cleanly.
  const { error: voidError } = await db
    .from('program_enrollments')
    .update({ payout_status: 'voided' })
    .eq('id', enrollment_id);
  if (voidError) return safeInternalError(voidError, 'Failed to void payout');

  // Hold the payout schedule so the voided payout cannot be released
  // afterwards by mark-payout-paid or the program-holder-payouts cron.
  // No schedule row exists for payouts raised without a schedule; that is
  // fine — zero rows matched is not an error.
  const { error: scheduleError } = await db
    .from('payout_schedules')
    .update({ increment_1_status: 'held', updated_at: new Date().toISOString() })
    .eq('enrollment_id', enrollment_id)
    .in('increment_1_status', ['pending', 'approved']);
  if (scheduleError) return safeInternalError(scheduleError, 'Failed to hold payout schedule');

  // Audit entry
  await db.from('enrollment_voucher_audit').insert({
    enrollment_id,
    changed_by: auth.id,
    field_name: 'payout_status',
    old_value: enrollment.payout_status,
    new_value: 'voided',
    note: `Payout voided by admin: ${voidReason}`,
  });

  return NextResponse.json({ voided: true, enrollment_id, payout_status: 'voided' });
}
