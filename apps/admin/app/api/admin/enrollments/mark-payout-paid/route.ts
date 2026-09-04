// AUTH: admin/admin only — staff cannot mark payouts paid
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  getProgramHolderPaymentReadiness,
  getStudentPaymentReadiness,
} from '@/lib/program-holder/onboarding-readiness';
import { releaseProgramHolderPayment } from '@/lib/program-holder/release-payment';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  // Only admin/admin can mark paid — not staff
  const db = await requireAdminClient();
  if (!db) return safeError('Server error', 500);

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', auth.id)
    .maybeSingle();

  if (!profile || !['admin'].includes(profile.role)) {
    return safeError('Only admins can mark payouts as paid', 403);
  }

  const { enrollment_id, release_date } = await request.json();
  if (!enrollment_id) return safeError('enrollment_id required', 400);

  const { data: paymentEnrollment } = await db
    .from('program_enrollments')
    .select('program_holder_id')
    .eq('id', enrollment_id)
    .maybeSingle();
  if (!paymentEnrollment?.program_holder_id)
    return safeError('Program Holder assignment required before payment', 409);
  const [holderReadiness, studentReadiness] = await Promise.all([
    getProgramHolderPaymentReadiness(db, paymentEnrollment.program_holder_id),
    getStudentPaymentReadiness(db, enrollment_id),
  ]);
  if (!holderReadiness.ready || !studentReadiness.ready) {
    return NextResponse.json(
      {
        error:
          'Payment is on hold until Program Holder onboarding and this student’s graduation closeout are complete.',
        missing_requirements: [...holderReadiness.missing, ...studentReadiness.missing],
      },
      { status: 409 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const approvedReleaseDate = typeof release_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(release_date)
    ? release_date
    : today;
  const { data: schedule, error: scheduleError } = await db
    .from('payout_schedules')
    .update({
      increment_1_status: 'approved',
      increment_1_approved_at: new Date().toISOString(),
      increment_1_release_date: approvedReleaseDate,
      updated_at: new Date().toISOString(),
    })
    .eq('enrollment_id', enrollment_id)
    .neq('increment_1_status', 'paid')
    .select('id')
    .maybeSingle();
  if (scheduleError) return safeInternalError(scheduleError, 'Failed to approve payout schedule');
  if (!schedule) return safeError('Payout schedule is missing or already paid', 409);

  if (approvedReleaseDate > today) {
    await db.from('enrollment_voucher_audit').insert({
      enrollment_id,
      changed_by: auth.id,
      field_name: 'payout_status',
      old_value: 'pending',
      new_value: 'approved',
      note: `Stripe transfer approved for automatic release on ${approvedReleaseDate}.`,
    });
    return NextResponse.json({ scheduled: true, release_date: approvedReleaseDate });
  }

  const release = await releaseProgramHolderPayment(db, enrollment_id, auth.id);
  if (!release.released) {
    return NextResponse.json(
      { error: release.error || 'Payment could not be released.', missing_requirements: release.missing || [] },
      { status: 409 },
    );
  }

  // Audit entry
  await db.from('enrollment_voucher_audit').insert({
    enrollment_id,
    changed_by: auth.id,
    field_name: 'payout_status',
    old_value: 'pending',
    new_value: 'paid',
    note: release.quickBooksSynced
      ? `Stripe transfer completed and recorded in QuickBooks (payment ID: ${release.quickBooksPaymentId})`
      : 'Stripe transfer completed; QuickBooks recording is pending.',
  });

  const { data: auditLog } = await db
    .from('enrollment_voucher_audit')
    .select('id, changed_at, field_name, old_value, new_value, note, changed_by')
    .eq('enrollment_id', enrollment_id)
    .order('changed_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    released: true,
    stripe_transfer_recorded: Boolean(release.stripeTransferId),
    audit_log: auditLog ?? [],
    quickbooks: {
      synced: Boolean(release.quickBooksSynced),
      qb_payment_id: release.quickBooksPaymentId || null,
    },
  });
}
