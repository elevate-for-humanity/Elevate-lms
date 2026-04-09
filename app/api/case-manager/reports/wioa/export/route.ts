/**
 * POST /api/case-manager/reports/wioa/export
 * Returns a CSV of WIOA outcome metrics for the case manager's caseload.
 * Auth: case_manager, admin, super_admin, staff.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const ALLOWED_ROLES = ['case_manager', 'admin', 'super_admin', 'staff'];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return safeError('Unauthorized', 401);

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: profile } = await db
    .from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!ALLOWED_ROLES.includes(profile?.role ?? '')) return safeError('Forbidden', 403);

  try {
    // Resolve caseload
    const { data: assignments } = await db
      .from('case_manager_assignments')
      .select('application_id')
      .eq('case_manager_id', user.id);

    const applicationIds = (assignments ?? []).map((a: any) => a.application_id as string);
    if (!applicationIds.length) {
      return new NextResponse('Last Name,First Name,Email,WIOA Program,Eligibility,Entry Date,Exit Date,Q2 Employed,Q4 Employed,Credential Attained,Skill Gain,Q2 Median Earnings,Employer,Wage\n', {
        headers: {
          'Content-Type':        'text/csv',
          'Content-Disposition': 'attachment; filename="wioa-outcomes.csv"',
        },
      });
    }

    const { data: apps } = await db
      .from('applications').select('email').in('id', applicationIds);
    const emails = (apps ?? []).map((a: any) => a.email).filter(Boolean);

    const { data: profiles } = await db
      .from('profiles').select('id, email').in('email', emails);
    const userIds = (profiles ?? []).map((p: any) => p.id);
    const emailByUserId = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.email]));

    const { data: wioaRows } = await db
      .from('wioa_participants')
      .select('id, user_id, first_name, last_name, email, wioa_program, eligibility_status')
      .in('user_id', userIds)
      .order('last_name');

    const wioaIds = (wioaRows ?? []).map((w: any) => w.id);

    const { data: outcomes } = wioaIds.length ? await db
      .from('wioa_participant_records')
      .select('participant_id, program_entry_date, program_exit_date, employed_q2_after_exit, employed_q4_after_exit, median_earnings_q2, credential_attained, measurable_skill_gain')
      .in('participant_id', wioaIds)
      .order('reporting_period_end', { ascending: false }) : { data: [] };

    const outcomeMap: Record<string, any> = {};
    for (const o of outcomes ?? []) {
      if (!outcomeMap[o.participant_id]) outcomeMap[o.participant_id] = o;
    }

    const { data: placements } = userIds.length ? await db
      .from('placement_records')
      .select('learner_id, employer_name, hourly_wage')
      .in('learner_id', userIds)
      .eq('status', 'verified')
      .order('start_date', { ascending: false }) : { data: [] };

    const placementMap: Record<string, any> = {};
    for (const p of placements ?? []) {
      if (!placementMap[p.learner_id]) placementMap[p.learner_id] = p;
    }

    // Build CSV
    const headers = [
      'Last Name', 'First Name', 'Email', 'WIOA Program', 'Eligibility',
      'Entry Date', 'Exit Date', 'Q2 Employed', 'Q4 Employed',
      'Credential Attained', 'Skill Gain', 'Q2 Median Earnings',
      'Employer', 'Hourly Wage',
    ];

    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = (wioaRows ?? []).map((w: any) => {
      const o = outcomeMap[w.id];
      const p = placementMap[w.user_id];
      return [
        w.last_name ?? '',
        w.first_name ?? '',
        w.email ?? emailByUserId[w.user_id] ?? '',
        w.wioa_program ?? '',
        w.eligibility_status ?? '',
        o?.program_entry_date ?? '',
        o?.program_exit_date ?? '',
        o ? (o.employed_q2_after_exit ? 'Yes' : 'No') : '',
        o ? (o.employed_q4_after_exit ? 'Yes' : 'No') : '',
        o ? (o.credential_attained    ? 'Yes' : 'No') : '',
        o ? (o.measurable_skill_gain  ? 'Yes' : 'No') : '',
        o?.median_earnings_q2 ?? '',
        p?.employer_name ?? '',
        p?.hourly_wage ?? '',
      ].map(escape).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type':        'text/csv',
        'Content-Disposition': `attachment; filename="wioa-outcomes-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    return safeInternalError(err, 'POST /api/case-manager/reports/wioa/export');
  }
}
