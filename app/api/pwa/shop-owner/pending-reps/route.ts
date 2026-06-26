import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/pwa/shop-owner/pending-reps
 *
 * Returns unverified competency_log entries for apprentices placed at
 * the calling supervisor's shop(s).
 *
 * Auth: caller must have a shop_supervisors row (user_id = current user)
 * OR a shop_placements row where supervisor_email = caller's email.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const db = await getAdminClient();
    if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    // Resolve which apprentices this supervisor oversees.
    // Path 1: shop_supervisors row → apprentice_placements at same shop
    const { data: supervisorRow } = await db
      .from('shop_supervisors')
      .select('shop_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    const uniqueApprenticeIds = new Set<string>();

    if (supervisorRow) {
      const { data: placements } = await db
        .from('apprentice_placements')
        .select('student_id')
        .eq('shop_id', supervisorRow.shop_id)
        .eq('status', 'active');

      (placements ?? []).forEach(p => {
        if (p.student_id) uniqueApprenticeIds.add(p.student_id);
      });
    }

    // Path 2: partner user → apprenticeships scoped to partner_id
    const { data: partnerUser } = await db
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (partnerUser?.partner_id) {
      const { data: apprenticeships } = await db
        .from('apprenticeships')
        .select('apprentice_id')
        .eq('partner_id', partnerUser.partner_id)
        .eq('status', 'active');

      (apprenticeships ?? []).forEach(apprenticeship => {
        if (apprenticeship.apprentice_id) uniqueApprenticeIds.add(apprenticeship.apprentice_id);
      });
    }

    // Path 3: shop_placements supervisor_email fallback.
    // Gated by SUPERVISOR_EMAIL_FALLBACK_ENABLED=true. Disabled by default.
    const emailFallbackEnabled = process.env.SUPERVISOR_EMAIL_FALLBACK_ENABLED === 'true';

    if (uniqueApprenticeIds.size === 0 && emailFallbackEnabled) {
      const { data: profile } = await db
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.email) {
        const { data: textPlacements } = await db
          .from('shop_placements')
          .select('student_id')
          .eq('supervisor_email', profile.email)
          .eq('status', 'active');

        (textPlacements ?? []).forEach(p => {
          if (p.student_id) uniqueApprenticeIds.add(p.student_id);
        });
      }
    }

    const apprenticeIds = [...uniqueApprenticeIds];

    if (apprenticeIds.length === 0) {
      return NextResponse.json({ entries: [] });
    }

    // Fetch unverified competency_log entries for these apprentices
    const { data: logs, error: logsErr } = await db
      .from('competency_log')
      .select(`
        id,
        apprentice_id,
        skill_id,
        work_date,
        service_count,
        notes,
        supervisor_name,
        created_at,
        apprentice_skills (
          name
        ),
        profiles:apprentice_id (
          full_name,
          first_name,
          last_name
        )
      `)
      .in('apprentice_id', apprenticeIds)
      .eq('supervisor_verified', false)
      .order('created_at', { ascending: true });

    if (logsErr) return safeInternalError(logsErr, 'Failed to fetch pending reps');

    const entries = (logs ?? []).map(log => ({
      id: log.id,
      apprenticeId: log.apprentice_id,
      apprenticeName:
        (log.profiles as any)?.full_name ||
        [(log.profiles as any)?.first_name, (log.profiles as any)?.last_name]
          .filter(Boolean)
          .join(' ') ||
        'Apprentice',
      skillName: (log.apprentice_skills as any)?.name ?? 'Unknown skill',
      workDate: log.work_date,
      serviceCount: log.service_count ?? 1,
      notes: log.notes ?? null,
      supervisorName: log.supervisor_name ?? null,
      submittedAt: log.created_at,
    }));

    return NextResponse.json({ entries });
  } catch (err) {
    return safeInternalError(err, 'Failed to load pending reps');
  }
}
