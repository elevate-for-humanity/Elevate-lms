// AUTH: admin/admin/staff only
// Returns enrollments where payout has been triggered, filtered by status.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // pending | due | overdue | paid | all

  let query = db
    .from('program_enrollments')
    .select(
      `
      id,
      user_id,
      status,
      program_slug,
      program_holder_id,
      student_start_date,
      voucher_issued_date,
      voucher_paid_date,
      payout_due_date,
      payout_status,
      payout_amount,
      payout_paid_date,
      payout_notes
    `,
    )
    .neq('payout_status', 'not_triggered')
    .order('payout_due_date', { ascending: true });

  if (status && status !== 'all') {
    query = query.eq('payout_status', status);
  }

  const { data: rawData, error } = await query;
  if (error) return safeInternalError(error, 'Failed to fetch payout queue');

  // Hydrate profiles (user_id → profiles)
  const userIds = [...new Set((rawData ?? []).map((r: any) => r.user_id).filter(Boolean))];
  const { data: profileRows } = userIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profileRows ?? []).map((p: any) => [p.id, p]));

  // Hydrate program_holders (program_holder_id → program_holders)
  const holderIds = [...new Set((rawData ?? []).map((r: any) => r.program_holder_id).filter(Boolean))];
  const { data: holderRows } = holderIds.length
    ? await db.from('program_holders').select('id, name, contact_name, contact_email').in('id', holderIds)
    : { data: [] };
  const holderMap = Object.fromEntries((holderRows ?? []).map((h: any) => [h.id, h]));

  const data = (rawData ?? []).map((r: any) => ({
    ...r,
    profiles: profileMap[r.user_id] ?? null,
    program_holders: holderMap[r.program_holder_id] ?? null,
  }));

  const now = new Date();
  const enriched = data.map((row) => ({
    ...row,
    payout_status:
      row.payout_status !== 'paid' && row.payout_due_date && new Date(row.payout_due_date) < now
        ? 'overdue'
        : row.payout_status,
    days_until_due:
      row.payout_due_date && row.payout_status !== 'paid'
        ? Math.ceil(
            (new Date(row.payout_due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null,
  }));

  return NextResponse.json({ queue: enriched, total: enriched.length });
}
