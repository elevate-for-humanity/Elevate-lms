// AUTH: admin/super_admin/staff only
// Returns enrollments where payout has been triggered, filtered by status.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // pending | due | overdue | paid | all

  let query = db
    .from('program_enrollments')
    .select(`
      id,
      user_id,
      status,
      program_slug,
      student_start_date,
      voucher_issued_date,
      voucher_paid_date,
      payout_due_date,
      payout_status,
      payout_paid_date,
      payout_notes,
      program_holders:partner_id ( name, contact_name, contact_email )
    `)
    .neq('payout_status', 'not_triggered')
    .order('payout_due_date', { ascending: true });

  if (status && status !== 'all') {
    query = query.eq('payout_status', status);
  }

  // Mark overdue: payout_due_date < now and not paid
  const { data: rawData, error } = await query;
  if (error) return safeInternalError(error, 'Failed to fetch payout queue');

  // Hydrate profiles separately (user_id → auth.users, no FK to profiles)
  const userIds = [...new Set((rawData ?? []).map((r: any) => r.user_id).filter(Boolean))];
  const { data: profileRows } = userIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profileRows ?? []).map((p: any) => [p.id, p]));
  const data = (rawData ?? []).map((r: any) => ({ ...r, profiles: profileMap[r.user_id] ?? null }));

  const now = new Date();
  const enriched = data.map(row => ({
    ...row,
    payout_status: row.payout_status !== 'paid' && row.payout_due_date && new Date(row.payout_due_date) < now
      ? 'overdue'
      : row.payout_status,
    days_until_due: row.payout_due_date && row.payout_status !== 'paid'
      ? Math.ceil((new Date(row.payout_due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));

  return NextResponse.json({ queue: enriched, total: enriched.length });
}
