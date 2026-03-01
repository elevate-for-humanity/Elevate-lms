export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Cohort outcomes report for partners and funders.
 * Returns per-student: completion %, credentials earned, attendance, workforce outcome category.
 * Expected hours are DERIVED from cohort metadata, not hard-coded.
 */

async function requireAdmin() {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'sponsor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, db };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const cohortId = url.searchParams.get('cohort_id');

  if (!cohortId) {
    return NextResponse.json({ error: 'cohort_id required' }, { status: 400 });
  }

  // 1. Load cohort metadata
  const { data: cohort } = await auth.db
    .from('cohorts')
    .select('*, programs:program_id(title, slug, issuance_policy)')
    .eq('id', cohortId)
    .single();

  if (!cohort) {
    return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
  }

  // 2. Derive expected hours range from cohort metadata
  const sessionMinutes = cohort.session_length_minutes_default || 180;
  const expectedHoursMin = (cohort.duration_weeks_min || 0) * (cohort.sessions_per_week_min || 0) * (sessionMinutes / 60);
  const expectedHoursMax = (cohort.duration_weeks_max || 0) * (cohort.sessions_per_week_max || 0) * (sessionMinutes / 60);

  // 3. Get delivered hours from actual sessions
  const { data: sessions } = await auth.db
    .from('cohort_sessions')
    .select('delivered_minutes, duration_minutes')
    .eq('cohort_id', cohortId);

  const deliveredMinutes = (sessions || []).reduce(
    (sum, s) => sum + (s.delivered_minutes || s.duration_minutes || 0), 0
  );
  const deliveredHours = deliveredMinutes / 60;

  // 4. Get enrollments for this cohort
  const { data: enrollments } = await auth.db
    .from('program_enrollments')
    .select('user_id, status, progress_percent, completed_at, full_name, email')
    .eq('cohort_id', cohortId);

  const { data: studentEnrollments } = await auth.db
    .from('student_enrollments')
    .select('student_id, status, completed_at')
    .eq('cohort_id', cohortId);

  // Merge enrollment lists
  const allEnrollments = [
    ...(enrollments || []).map(e => ({ ...e, user_id: e.user_id })),
    ...(studentEnrollments || []).map(e => ({ ...e, user_id: e.student_id })),
  ];

  const userIds = [...new Set(allEnrollments.map(e => e.user_id).filter(Boolean))];

  // 5. Get credentials earned per student
  const { data: certificates } = userIds.length > 0
    ? await auth.db
        .from('certificates')
        .select('student_id, credential_stack, issued_date, course_title, program_name')
        .in('student_id', userIds)
    : { data: [] };

  // 6. Get attendance summary per student
  const { data: attendance } = userIds.length > 0
    ? await auth.db
        .from('cohort_attendance')
        .select('user_id, status, minutes_attended, cohort_session_id')
        .in('cohort_session_id', (sessions || []).map(() => '').length > 0
          ? (await auth.db.from('cohort_sessions').select('id').eq('cohort_id', cohortId)).data?.map(s => s.id) || []
          : []
        )
    : { data: [] };

  const totalSessions = (sessions || []).length;

  // 7. Build per-student outcomes
  const studentOutcomes = userIds.map(userId => {
    const enrollment = allEnrollments.find(e => e.user_id === userId);
    const studentCerts = (certificates || []).filter(c => c.student_id === userId);
    const studentAttendance = (attendance || []).filter(a => a.user_id === userId);
    const sessionsAttended = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceMinutes = studentAttendance.reduce((sum, a) => sum + (a.minutes_attended || 0), 0);

    // Determine workforce outcome category
    let outcomeCategory = 'In Progress';
    if (enrollment?.completed_at || enrollment?.status === 'completed') {
      outcomeCategory = studentCerts.length > 0 ? 'Credential Earned' : 'Program Complete';
    } else if (studentCerts.length > 0) {
      outcomeCategory = 'Credential Earned';
    }

    return {
      user_id: userId,
      student_name: (enrollment as any)?.full_name || 'Unknown',
      email: (enrollment as any)?.email || '',
      enrollment_status: enrollment?.status || 'unknown',
      progress_percent: (enrollment as any)?.progress_percent || 0,
      sessions_attended: sessionsAttended,
      total_sessions: totalSessions,
      attendance_percent: totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 100) : 0,
      attendance_hours: Math.round((attendanceMinutes / 60) * 10) / 10,
      credentials_earned: studentCerts.map(c => ({
        title: c.course_title || c.program_name,
        issued_date: c.issued_date,
        type: c.credential_stack?.issuance_policy || 'course_certificate',
      })),
      credential_count: studentCerts.length,
      outcome_category: outcomeCategory,
      completed_at: enrollment?.completed_at || null,
    };
  });

  return NextResponse.json({
    cohort: {
      id: cohort.id,
      name: cohort.cohort_name || cohort.name,
      program: cohort.programs?.title || cohort.program_slug,
      partner: cohort.partner_name,
      status: cohort.status,
      start_date: cohort.cohort_start_date || cohort.start_date,
      end_date: cohort.cohort_end_date || cohort.end_date,
      delivery_window: cohort.delivery_window_text,
      funding_streams: cohort.funding_streams,
    },
    hours: {
      expected_min: Math.round(expectedHoursMin * 10) / 10,
      expected_max: Math.round(expectedHoursMax * 10) / 10,
      delivered: Math.round(deliveredHours * 10) / 10,
      sessions_completed: totalSessions,
    },
    summary: {
      total_enrolled: userIds.length,
      completed: studentOutcomes.filter(s => s.outcome_category === 'Program Complete' || s.outcome_category === 'Credential Earned').length,
      credentials_earned: studentOutcomes.filter(s => s.credential_count > 0).length,
      in_progress: studentOutcomes.filter(s => s.outcome_category === 'In Progress').length,
      avg_attendance_percent: userIds.length > 0
        ? Math.round(studentOutcomes.reduce((sum, s) => sum + s.attendance_percent, 0) / userIds.length)
        : 0,
    },
    students: studentOutcomes,
  });
}
