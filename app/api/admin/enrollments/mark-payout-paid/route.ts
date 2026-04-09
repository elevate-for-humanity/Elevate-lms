// AUTH: admin/super_admin only — staff cannot mark payouts paid
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  // Only admin/super_admin can mark paid — not staff
  const db = await getAdminClient();
  if (!db) return safeError('Server error', 500);

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return safeError('Only admins can mark payouts as paid', 403);
  }

  const { enrollment_id } = await request.json();
  if (!enrollment_id) return safeError('enrollment_id required', 400);

  const now = new Date().toISOString();

  const { data: updated, error } = await db
    .from('program_enrollments')
    .update({
      payout_paid_date: now,
      payout_paid_by:   auth.user.id,
      payout_status:    'paid',
    })
    .eq('id', enrollment_id)
    .neq('payout_status', 'paid') // idempotency guard
    .select('id, payout_status, payout_paid_date, payout_due_date')
    .single();

  if (error) return safeInternalError(error, 'Failed to mark payout paid');
  if (!updated) return safeError('Already marked as paid or not found', 409);

  // Audit entry
  await db.from('enrollment_voucher_audit').insert({
    enrollment_id,
    changed_by: auth.user.id,
    field_name: 'payout_status',
    old_value:  'pending',
    new_value:  'paid',
    note:       'Marked as paid by admin',
  });

  const { data: auditLog } = await db
    .from('enrollment_voucher_audit')
    .select('id, changed_at, field_name, old_value, new_value, note, changed_by')
    .eq('enrollment_id', enrollment_id)
    .order('changed_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ enrollment: updated, audit_log: auditLog ?? [] });
}
