// AUTH: admin/super_admin/staff only
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

const TRACKED_FIELDS = [
  'student_start_date',
  'voucher_issued_date',
  'voucher_paid_date',
  'payout_notes',
] as const;

export async function PATCH(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { enrollment_id, student_start_date, voucher_issued_date, voucher_paid_date, payout_notes } = body;

  if (!enrollment_id) return safeError('enrollment_id required', 400);

  // Client-side guard mirrored server-side
  if (voucher_paid_date && !voucher_issued_date) {
    return safeError('voucher_issued_date must be set before voucher_paid_date', 400);
  }

  const db = createAdminClient();
  if (!db) return safeError('Server error', 500);

  // Fetch current values for audit diff
  const { data: current, error: fetchErr } = await db
    .from('program_enrollments')
    .select('student_start_date, voucher_issued_date, voucher_paid_date, payout_notes')
    .eq('id', enrollment_id)
    .single();

  if (fetchErr || !current) return safeError('Enrollment not found', 404);

  const updates: Record<string, string | null> = {
    student_start_date:  student_start_date  ?? null,
    voucher_issued_date: voucher_issued_date ?? null,
    voucher_paid_date:   voucher_paid_date   ?? null,
    payout_notes:        payout_notes        ?? null,
  };

  const { data: updated, error: updateErr } = await db
    .from('program_enrollments')
    .update(updates)
    .eq('id', enrollment_id)
    .select('id, student_start_date, voucher_issued_date, voucher_paid_date, payout_due_date, payout_status, payout_paid_date, payout_notes')
    .single();

  if (updateErr) return safeInternalError(updateErr, 'Failed to update enrollment');

  // Write audit rows for changed fields
  const auditRows = TRACKED_FIELDS
    .filter(f => (updates[f] ?? null) !== ((current as Record<string, string | null>)[f] ?? null))
    .map(f => ({
      enrollment_id,
      changed_by:  auth.user.id,
      field_name:  f,
      old_value:   (current as Record<string, string | null>)[f] ?? null,
      new_value:   updates[f] ?? null,
    }));

  if (auditRows.length > 0) {
    await db.from('enrollment_voucher_audit').insert(auditRows);
  }

  // Return updated enrollment + fresh audit log
  const { data: auditLog } = await db
    .from('enrollment_voucher_audit')
    .select('id, changed_at, field_name, old_value, new_value, note, changed_by')
    .eq('enrollment_id', enrollment_id)
    .order('changed_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ enrollment: updated, audit_log: auditLog ?? [] });
}
