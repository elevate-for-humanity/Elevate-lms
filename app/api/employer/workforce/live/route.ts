/**
 * GET /api/employer/workforce/live
 *
 * Returns live workforce visibility data for the authenticated employer:
 *   - Active clock-ins (open progress_entries with no clock_out_at)
 *   - Today's completed shifts
 *   - Weekly hours summary per apprentice
 *   - Apprentices with no activity in the last 7 days (at-risk)
 *
 * Scoped to the employer's own apprentices via profiles.employer_id.
 * Admins and super_admins see all apprentices.
 *
 * Response shape:
 * {
 *   activeShifts: ClockInRow[],
 *   completedToday: ClockInRow[],
 *   weeklyHours: WeeklyHoursRow[],
 *   atRisk: AtRiskRow[],
 *   summary: { activeNow: number, completedToday: number, totalWeeklyHours: number, atRiskCount: number }
 * }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, employer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['employer', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Admins see all; employers are scoped to their own apprentices
    const isAdmin = ['admin', 'super_admin', 'staff'].includes(profile.role);
    const db = await requireAdminClient();

    // ── Resolve apprentice user IDs for this employer ─────────────────────────
    let apprenticeUserIds: string[] = [];

    if (!isAdmin && profile.employer_id) {
      const { data: apprenticeProfiles } = await db
        .from('profiles')
        .select('id')
        .eq('employer_id', profile.employer_id)
        .eq('role', 'apprentice');

      apprenticeUserIds = (apprenticeProfiles ?? []).map((p: any) => p.id);

      if (apprenticeUserIds.length === 0) {
        return NextResponse.json({
          activeShifts: [],
          completedToday: [],
          weeklyHours: [],
          atRisk: [],
          summary: { activeNow: 0, completedToday: 0, totalWeeklyHours: 0, atRiskCount: 0 },
        });
      }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // ── Active shifts (clock_out_at IS NULL) ──────────────────────────────────
    let activeQuery = db
      .from('progress_entries')
      .select(`
        id,
        apprentice_id,
        program_id,
        site_id,
        clock_in_at,
        work_date,
        profiles!progress_entries_user_id_fkey (
          id, full_name, email
        )
      `)
      .is('clock_out_at', null)
      .not('clock_in_at', 'is', null)
      .order('clock_in_at', { ascending: false });

    if (!isAdmin && apprenticeUserIds.length > 0) {
      activeQuery = activeQuery.in('user_id', apprenticeUserIds);
    }

    const { data: activeShifts, error: activeErr } = await activeQuery;
    if (activeErr) logger.warn('[employer/workforce/live] active shifts query failed', activeErr);

    // ── Completed shifts today ────────────────────────────────────────────────
    let todayQuery = db
      .from('progress_entries')
      .select(`
        id,
        apprentice_id,
        program_id,
        site_id,
        clock_in_at,
        clock_out_at,
        hours_worked,
        work_date,
        profiles!progress_entries_user_id_fkey (
          id, full_name, email
        )
      `)
      .not('clock_out_at', 'is', null)
      .gte('work_date', todayStart.toISOString().split('T')[0])
      .order('clock_out_at', { ascending: false });

    if (!isAdmin && apprenticeUserIds.length > 0) {
      todayQuery = todayQuery.in('user_id', apprenticeUserIds);
    }

    const { data: completedToday, error: todayErr } = await todayQuery;
    if (todayErr) logger.warn('[employer/workforce/live] today query failed', todayErr);

    // ── Weekly hours per apprentice ───────────────────────────────────────────
    let weeklyQuery = db
      .from('progress_entries')
      .select(`
        user_id,
        hours_worked,
        work_date,
        profiles!progress_entries_user_id_fkey (
          id, full_name, email
        )
      `)
      .not('clock_out_at', 'is', null)
      .gte('work_date', weekStart.toISOString().split('T')[0]);

    if (!isAdmin && apprenticeUserIds.length > 0) {
      weeklyQuery = weeklyQuery.in('user_id', apprenticeUserIds);
    }

    const { data: weeklyEntries, error: weeklyErr } = await weeklyQuery;
    if (weeklyErr) logger.warn('[employer/workforce/live] weekly query failed', weeklyErr);

    // Aggregate weekly hours per user
    const weeklyMap: Record<string, { user_id: string; full_name: string; email: string; total_hours: number; shift_count: number }> = {};
    for (const entry of weeklyEntries ?? []) {
      const uid = entry.user_id;
      if (!uid) continue;
      if (!weeklyMap[uid]) {
        const p = (entry as any).profiles;
        weeklyMap[uid] = {
          user_id: uid,
          full_name: p?.full_name ?? 'Unknown',
          email: p?.email ?? '',
          total_hours: 0,
          shift_count: 0,
        };
      }
      weeklyMap[uid].total_hours += entry.hours_worked ?? 0;
      weeklyMap[uid].shift_count += 1;
    }
    const weeklyHours = Object.values(weeklyMap).sort((a, b) => b.total_hours - a.total_hours);

    // ── At-risk: apprentices with no activity in last 7 days ─────────────────
    const activeUserIds = new Set(Object.keys(weeklyMap));
    let atRisk: { user_id: string; full_name: string; email: string; last_activity: string | null }[] = [];

    if (!isAdmin && apprenticeUserIds.length > 0) {
      const inactiveIds = apprenticeUserIds.filter((id) => !activeUserIds.has(id));
      if (inactiveIds.length > 0) {
        const { data: inactiveProfiles } = await db
          .from('profiles')
          .select('id, full_name, email')
          .in('id', inactiveIds);

        // Get last activity date for each
        const { data: lastEntries } = await db
          .from('progress_entries')
          .select('user_id, work_date')
          .in('user_id', inactiveIds)
          .order('work_date', { ascending: false });

        const lastActivityMap: Record<string, string> = {};
        for (const e of lastEntries ?? []) {
          if (e.user_id && !lastActivityMap[e.user_id]) {
            lastActivityMap[e.user_id] = e.work_date;
          }
        }

        atRisk = (inactiveProfiles ?? []).map((p: any) => ({
          user_id: p.id,
          full_name: p.full_name ?? 'Unknown',
          email: p.email ?? '',
          last_activity: lastActivityMap[p.id] ?? null,
        }));
      }
    }

    const totalWeeklyHours = weeklyHours.reduce((sum, r) => sum + r.total_hours, 0);

    return NextResponse.json({
      activeShifts: (activeShifts ?? []).map((s: any) => ({
        id: s.id,
        apprentice_id: s.apprentice_id,
        user_id: s.profiles?.id ?? null,
        full_name: s.profiles?.full_name ?? 'Unknown',
        email: s.profiles?.email ?? '',
        program_id: s.program_id,
        site_id: s.site_id,
        clock_in_at: s.clock_in_at,
        work_date: s.work_date,
        duration_min: s.clock_in_at
          ? Math.round((Date.now() - new Date(s.clock_in_at).getTime()) / 60000)
          : null,
      })),
      completedToday: (completedToday ?? []).map((s: any) => ({
        id: s.id,
        apprentice_id: s.apprentice_id,
        user_id: s.profiles?.id ?? null,
        full_name: s.profiles?.full_name ?? 'Unknown',
        email: s.profiles?.email ?? '',
        program_id: s.program_id,
        site_id: s.site_id,
        clock_in_at: s.clock_in_at,
        clock_out_at: s.clock_out_at,
        hours_worked: s.hours_worked ?? 0,
        work_date: s.work_date,
      })),
      weeklyHours,
      atRisk,
      summary: {
        activeNow: (activeShifts ?? []).length,
        completedToday: (completedToday ?? []).length,
        totalWeeklyHours: Math.round(totalWeeklyHours * 10) / 10,
        atRiskCount: atRisk.length,
      },
    });
  } catch (err) {
    logger.error('[employer/workforce/live] Unexpected error', err as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/employer/workforce/live', _GET);
