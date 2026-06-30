/**
 * GET /api/workforce-board/reports
 *
 * Aggregate reporting for workforce board oversight.
 * Returns participant counts, placement rates, funding utilization,
 * and program performance metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

const ALLOWED_ROLES = ['workforce_board', 'admin', 'super_admin', 'staff'];

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  try {
    const supabase = await getAdminClient();

    const [
      participantsRes,
      activeParticipantsRes,
      placementsRes,
      vouchersRes,
      applicationsRes,
      enrollmentsRes,
      certificatesRes,
    ] = await Promise.allSettled([
      supabase.from('wioa_participants').select('id', { count: 'exact', head: true }),
      supabase.from('wioa_participants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('job_placements').select('id', { count: 'exact', head: true }).eq('status', 'placed'),
      supabase.from('ita_vouchers').select('amount').eq('status', 'issued'),
      supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'in_review', 'approved']),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    ]);

    const c = (r: PromiseSettledResult<{ count: number | null }>) =>
      r.status === 'fulfilled' ? (r.value.count ?? 0) : 0;

    const totalFunding = vouchersRes.status === 'fulfilled'
      ? (vouchersRes.value.data ?? []).reduce((sum: number, v: { amount?: number }) => sum + (v.amount ?? 0), 0)
      : 0;

    const placementRate = c(participantsRes as PromiseSettledResult<{ count: number | null }>) > 0
      ? Math.round((c(placementsRes as PromiseSettledResult<{ count: number | null }>) / c(participantsRes as PromiseSettledResult<{ count: number | null }>)) * 100)
      : 0;

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      participants: {
        total: c(participantsRes as PromiseSettledResult<{ count: number | null }>),
        active: c(activeParticipantsRes as PromiseSettledResult<{ count: number | null }>),
      },
      placements: {
        total: c(placementsRes as PromiseSettledResult<{ count: number | null }>),
        placement_rate_pct: placementRate,
      },
      funding: {
        total_authorized: totalFunding,
        vouchers_issued: vouchersRes.status === 'fulfilled' ? (vouchersRes.value.data?.length ?? 0) : 0,
      },
      applications: {
        active: c(applicationsRes as PromiseSettledResult<{ count: number | null }>),
      },
      enrollments: {
        total: c(enrollmentsRes as PromiseSettledResult<{ count: number | null }>),
      },
      certificates: {
        issued: c(certificatesRes as PromiseSettledResult<{ count: number | null }>),
      },
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to generate report');
  }
}
