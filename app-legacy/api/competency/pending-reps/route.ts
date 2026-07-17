import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/competency/pending-reps
 *
 * Returns unverified competency_log entries for the calling partner or
 * shop supervisor. Used by the partner portal and shop-owner PWA.
 *
 * Response: { entries: PendingRep[] }
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);

    // Auth path 1: partner_users → apprenticeships
    const { data: partnerUser } = await db
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Auth path 2: shop_supervisors → apprentice_placements
    const { data: supervisorRow } = await db
      .from('shop_supervisors')
      .select('shop_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!partnerUser?.partner_id && !supervisorRow?.shop_id) {
      return safeError('Not authorized', 403);
    }

    let apprenticeIds: string[] = [];

    if (partnerUser?.partner_id) {
      const { data: apprenticeships } = await db
        .from('apprenticeships')
        .select('apprentice_id')
        .eq('partner_id', partnerUser.partner_id);
      apprenticeIds = (apprenticeships ?? []).map((a: any) => a.apprentice_id);
    }

    if (supervisorRow?.shop_id) {
      const { data: placements } = await db
        .from('apprentice_placements')
        .select('student_id')
        .eq('shop_id', supervisorRow.shop_id)
        .eq('status', 'active');
      const shopIds = (placements ?? []).map((p: any) => p.student_id);
      apprenticeIds = [...new Set([...apprenticeIds, ...shopIds])];
    }

    if (apprenticeIds.length === 0) {
      return NextResponse.json({ entries: [] });
    }

    const { data: logs, error: logsErr } = await db
      .from('competency_log')
      .select(
        `id,
         apprentice_id,
         skill_id,
         work_date,
         service_count,
         notes,
         submitted_at,
         profiles:apprentice_id ( full_name ),
         competency_skills:skill_id ( name )`,
      )
      .in('apprentice_id', apprenticeIds)
      .eq('supervisor_verified', false)
      .order('submitted_at', { ascending: false });

    if (logsErr) return safeInternalError(logsErr, 'Failed to fetch pending reps');

    const entries = (logs ?? []).map((log: any) => ({
      id: log.id,
      apprenticeId: log.apprentice_id,
      apprenticeName: log.profiles?.full_name ?? 'Unknown',
      skillName: log.competency_skills?.name ?? 'Unknown Skill',
      workDate: log.work_date,
      serviceCount: log.service_count,
      notes: log.notes ?? null,
      supervisorName: null,
      submittedAt: log.submitted_at,
    }));

    return NextResponse.json({ entries });
  } catch (err) {
    return safeInternalError(err, 'Failed to load pending reps');
  }
}
