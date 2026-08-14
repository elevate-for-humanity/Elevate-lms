// AUTH: admin/admin only — staff cannot mark payouts paid
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

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

  const { enrollment_id, push_to_quickbooks } = await request.json();
  if (!enrollment_id) return safeError('enrollment_id required', 400);

  const now = new Date().toISOString();

  const { data: updated, error } = await db
    .from('program_enrollments')
    .update({
      payout_paid_date: now,
      payout_paid_by: auth.id,
      payout_status: 'paid',
    })
    .eq('id', enrollment_id)
    .neq('payout_status', 'paid') // idempotency guard
    .select('id, payout_status, payout_paid_date, payout_due_date')
    .maybeSingle();

  if (error) return safeInternalError(error, 'Failed to mark payout paid');
  if (!updated) return safeError('Already marked as paid or not found', 409);

  // Push to QuickBooks if requested and QB is connected
  let qbResult: Record<string, unknown> | null = null;
  if (push_to_quickbooks !== false && process.env.QB_ACCESS_TOKEN) {
    try {
      // Get program holder details from enrollment
      const { data: enrollment } = await db
        .from('program_enrollments')
        .select('payout_amount, profiles:user_id(full_name, email)')
        .eq('id', enrollment_id)
        .maybeSingle();

      const profile = (enrollment?.profiles as any);
      if (enrollment && profile?.email) {
        const lmsBase = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
        const qbRes = await fetch(`${lmsBase}/api/quickbooks/contractor-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_API_KEY || '' },
          body: JSON.stringify({
            enrollment_id,
            amount:                enrollment.payout_amount ?? 0,
            program_holder_name:   profile.full_name ?? profile.email,
            program_holder_email:  profile.email,
            memo: `Voucher payment — enrollment ${enrollment_id}`,
          }),
        });
        if (qbRes.ok) qbResult = await qbRes.json();
      }
    } catch { /* non-fatal — payout still marked paid locally */ }
  }

  // Audit entry
  await db.from('enrollment_voucher_audit').insert({
    enrollment_id,
    changed_by: auth.id,
    field_name: 'payout_status',
    old_value: 'pending',
    new_value: 'paid',
    note: qbResult
      ? `Marked paid + pushed to QuickBooks (payment ID: ${qbResult.qb_payment_id})`
      : 'Marked as paid by admin',
  });

  const { data: auditLog } = await db
    .from('enrollment_voucher_audit')
    .select('id, changed_at, field_name, old_value, new_value, note, changed_by')
    .eq('enrollment_id', enrollment_id)
    .order('changed_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ enrollment: updated, audit_log: auditLog ?? [], quickbooks: qbResult });
}
