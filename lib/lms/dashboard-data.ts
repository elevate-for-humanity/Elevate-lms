import { logger } from '@/lib/logger';
/**
 * Real-time dashboard data fetching for LMS.
 * Organization-scoped callers must never receive platform-wide aggregates.
 */

import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  totalStudents: number;
  activeEnrollments: number;
  completionRate: number;
  atRiskCount: number;
  pendingVerifications: number;
  overdueRequirements: number;
}

export interface StudentProgress {
  enrollmentId: string;
  studentName: string;
  programName: string;
  progress: number;
  status: string;
  lastActivity: string;
  overdueCount: number;
}

export interface ProgramMetrics {
  programId: string;
  programName: string;
  totalEnrolled: number;
  activeStudents: number;
  completedStudents: number;
  averageProgress: number;
  atRiskCount: number;
}

/**
 * Get dashboard statistics. When orgId is supplied, every derived metric is
 * constrained to enrollment IDs belonging to that organization. Risk and
 * requirement tables are scoped through enrollment_id rather than queried
 * globally because they do not independently own organization scope.
 */
export async function getAdminDashboardStats(orgId?: string): Promise<DashboardStats> {
  const supabase = await createClient();

  let enrollmentQuery = supabase
    .from('program_enrollments')
    .select('id, enrollment_state, status');
  if (orgId) enrollmentQuery = enrollmentQuery.eq('organization_id', orgId);

  const { data: enrollmentRows, error: enrollmentError } = await enrollmentQuery;
  if (enrollmentError) {
    logger.error('Error fetching scoped dashboard enrollments:', enrollmentError);
    throw new Error('DASHBOARD_ENROLLMENT_SCOPE_FAILED');
  }

  const enrollments = enrollmentRows ?? [];
  const enrollmentIds = enrollments.map((row: any) => String(row.id));
  const stateOf = (row: any) => String(row.enrollment_state || row.status || '').toLowerCase();
  const totalStudents = enrollments.length;
  const activeEnrollments = enrollments.filter((row: any) =>
    ['active', 'enrolled', 'in_progress'].includes(stateOf(row)),
  ).length;
  const completedEnrollments = enrollments.filter((row: any) => stateOf(row) === 'completed').length;

  if (!enrollmentIds.length) {
    return {
      totalStudents: 0,
      activeEnrollments: 0,
      completionRate: 0,
      atRiskCount: 0,
      pendingVerifications: 0,
      overdueRequirements: 0,
    };
  }

  const now = new Date().toISOString();
  const [atRiskRes, pendingRes, overdueRes] = await Promise.all([
    supabase
      .from('student_risk_status')
      .select('id', { count: 'exact', head: true })
      .in('enrollment_id', enrollmentIds)
      .eq('status', 'at_risk'),
    supabase
      .from('student_requirements')
      .select('id', { count: 'exact', head: true })
      .in('enrollment_id', enrollmentIds)
      .eq('status', 'completed'),
    supabase
      .from('student_requirements')
      .select('id', { count: 'exact', head: true })
      .in('enrollment_id', enrollmentIds)
      .in('status', ['pending', 'in_progress'])
      .lt('due_date', now),
  ]);

  for (const [name, result] of [
    ['risk', atRiskRes],
    ['verification', pendingRes],
    ['overdue requirements', overdueRes],
  ] as const) {
    if (result.error) {
      logger.error(`Error fetching scoped dashboard ${name}:`, result.error);
      throw new Error(`DASHBOARD_${name.toUpperCase().replace(/\s+/g, '_')}_SCOPE_FAILED`);
    }
  }

  return {
    totalStudents,
    activeEnrollments,
    completionRate: totalStudents > 0 ? Math.round((completedEnrollments / totalStudents) * 100) : 0,
    atRiskCount: atRiskRes.count ?? 0,
    pendingVerifications: pendingRes.count ?? 0,
    overdueRequirements: overdueRes.count ?? 0,
  };
}

/** Get student progress data for program holder dashboard. */
export async function getStudentProgressList(programIds: string[]): Promise<StudentProgress[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('program_enrollments')
    .select(
      `
      id,
      enrollment_state,
      updated_at,
      profiles!enrollments_student_id_fkey(
        first_name,
        last_name
      ),
      programs(
        name
      ),
      student_risk_status(
        progress_percentage,
        status,
        overdue_count,
        last_activity_date
      )
    `,
    )
    .in('program_id', programIds)
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error('Error fetching student progress:', error);
    return [];
  }

  return data.map((enrollment: any) => ({
    enrollmentId: enrollment.id,
    studentName:
      `${enrollment.profiles?.first_name || ''} ${enrollment.profiles?.last_name || ''}`.trim() ||
      'Unknown',
    programName: enrollment.programs?.name || 'Unknown Program',
    progress: enrollment.student_risk_status?.progress_percentage || 0,
    status: enrollment.student_risk_status?.status || 'on_track',
    lastActivity: enrollment.student_risk_status?.last_activity_date || enrollment.updated_at,
    overdueCount: enrollment.student_risk_status?.overdue_count || 0,
  }));
}

/** Get program metrics for an organization-scoped workforce dashboard. */
export async function getProgramMetrics(orgId: string): Promise<ProgramMetrics[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('programs')
    .select(
      `
      id,
      name,
      enrollments(
        id,
        enrollment_state,
        student_risk_status(
          progress_percentage,
          status
        )
      )
    `,
    )
    .eq('organization_id', orgId);

  if (error) {
    logger.error('Error fetching program metrics:', error);
    return [];
  }

  return data.map((program: any) => {
    const enrollments = program.enrollments || [];
    const activeStudents = enrollments.filter((e: any) => e.enrollment_state === 'active').length;
    const completedStudents = enrollments.filter((e: any) => e.enrollment_state === 'completed').length;
    const atRiskCount = enrollments.filter((e: any) => e.student_risk_status?.status === 'at_risk').length;
    const totalProgress = enrollments.reduce(
      (sum: number, e: any) => sum + (e.student_risk_status?.progress_percentage || 0),
      0,
    );
    const averageProgress = enrollments.length > 0 ? Math.round(totalProgress / enrollments.length) : 0;

    return {
      programId: program.id,
      programName: program.name,
      totalEnrolled: enrollments.length,
      activeStudents,
      completedStudents,
      averageProgress,
      atRiskCount,
    };
  });
}

export async function getUserNotifications(userId: string, limit: number = 10) {
  const supabase = await createClient();
  const { data, error }: any = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    logger.error('Error fetching notifications:', error);
    return [];
  }
  return data || [];
}

export async function getUpcomingAppointments(studentId: string) {
  const supabase = await createClient();
  const { data, error }: any = await supabase
    .from('appointments')
    .select('*')
    .eq('student_id', studentId)
    .gte('scheduled_time', new Date().toISOString())
    .order('scheduled_time', { ascending: true })
    .limit(5);
  if (error) {
    logger.error('Error fetching appointments:', error);
    return [];
  }
  return data || [];
}

export async function getStudentActivity(enrollmentId: string, limit: number = 10) {
  const supabase = await createClient();
  const { data, error }: any = await supabase
    .from('student_activity_log')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    logger.error('Error fetching student activity:', error);
    return [];
  }
  return data || [];
}

export async function getStudentFunding(enrollmentId: string) {
  const supabase = await createClient();
  const { data, error }: any = await supabase
    .from('student_funding_assignments')
    .select(
      `
      *,
      funding_sources(
        name,
        code,
        type
      )
    `,
    )
    .eq('enrollment_id', enrollmentId);
  if (error) {
    logger.error('Error fetching student funding:', error);
    return [];
  }
  return data || [];
}

export async function getProgramCompletionStats(programId: string) {
  const supabase = await createClient();
  const { data, error }: any = await supabase
    .from('program_enrollments')
    .select(
      `
      id,
      status,
      completed_at,
      student_risk_status(
        progress_percentage
      )
    `,
    )
    .eq('program_id', programId);

  if (error) {
    logger.error('Error fetching completion stats:', error);
    return { totalEnrolled: 0, completed: 0, inProgress: 0, averageProgress: 0, completionRate: 0 };
  }

  const enrollments = data || [];
  const completed = enrollments.filter((e: any) => e.status === 'completed').length;
  const inProgress = enrollments.filter((e: any) => e.status === 'active').length;
  const totalProgress = enrollments.reduce(
    (sum: number, e: any) => sum + (e.student_risk_status?.progress_percentage || 0),
    0,
  );
  const averageProgress = enrollments.length > 0 ? Math.round(totalProgress / enrollments.length) : 0;
  const completionRate = enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0;

  return { totalEnrolled: enrollments.length, completed, inProgress, averageProgress, completionRate };
}
