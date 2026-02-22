import { logger } from '@/lib/logger';
/**
 * Real-time dashboard data fetching for LMS
 * Provides live data integration for all dashboard types
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
 * Get dashboard statistics for admin
 */
export async function getAdminDashboardStats(
  orgId?: string
): Promise<DashboardStats> {
  const supabase = await createClient();

  let query = supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true });

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  const [
    { count: totalStudents },
    { count: activeEnrollments },
    { data: completedData },
    { data: atRiskData },
    { data: pendingVerifications },
    { data: overdueData },
  ] = await Promise.all([
    supabase.from('program_enrollments').select('*', { count: 'exact', head: true }),
    supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase.from('program_enrollments').select('id').eq('status', 'completed'),
    supabase.from('student_risk_status').select('id').eq('status', 'at_risk'),
    supabase
      .from('student_requirements')
      .select('id')
      .eq('status', 'completed'),
    supabase
      .from('student_requirements')
      .select('id')
      .in('status', ['pending', 'in_progress'])
      .lt('due_date', new Date().toISOString()),
  ]);

  const completionRate =
    totalStudents && completedData
      ? Math.round((completedData.length / totalStudents) * 100)
      : 0;

  return {
    totalStudents: totalStudents || 0,
    activeEnrollments: activeEnrollments || 0,
    completionRate,
    atRiskCount: atRiskData?.length || 0,
    pendingVerifications: pendingVerifications?.length || 0,
    overdueRequirements: overdueData?.length || 0,
  };
}

/**
 * Get student progress data for program holder dashboard
 */
export async function getStudentProgressList(
  programIds: string[]
): Promise<StudentProgress[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('program_enrollments')
    .select(
      `
      id,
      status,
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
    `
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
    lastActivity:
      enrollment.student_risk_status?.last_activity_date ||
      enrollment.updated_at,
    overdueCount: enrollment.student_risk_status?.overdue_count || 0,
  }));
}

/**
 * Get program metrics for workforce board dashboard
 */
export async function getProgramMetrics(
  orgId: string
): Promise<ProgramMetrics[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('programs')
    .select(
      `
      id,
      name,
      enrollments(
        id,
        status,
        student_risk_status(
          progress_percentage,
          status
        )
      )
    `
    )
    .eq('organization_id', orgId);

  if (error) {
    logger.error('Error fetching program metrics:', error);
    return [];
  }

  return data.map((program: any) => {
    const enrollments = program.enrollments || [];
    const activeStudents = enrollments.filter(
      (e: any) => e.status === 'active'
    ).length;
    const completedStudents = enrollments.filter(
      (e: any) => e.status === 'completed'
    ).length;
    const atRiskCount = enrollments.filter(
      (e: any) => e.student_risk_status?.status === 'at_risk'
    ).length;

    const totalProgress = enrollments.reduce(
      (sum: number, e: any) =>
        sum + (e.student_risk_status?.progress_percentage || 0),
      0
    );
    const averageProgress =
      enrollments.length > 0
        ? Math.round(totalProgress / enrollments.length)
        : 0;

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

/**
 * Get real-time notifications for a user
 */
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

/**
 * Get upcoming appointments for a student
 */
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

/**
 * Get recent activity for a student
 */
export async function getStudentActivity(
  enrollmentId: string,
  limit: number = 10
) {
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

/**
 * Get funding summary for a student
 */
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
    `
    )
    .eq('enrollment_id', enrollmentId);

  if (error) {
    logger.error('Error fetching student funding:', error);
    return [];
  }

  return data || [];
}

/**
 * Get completion statistics for a program
 */
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
    `
    )
    .eq('program_id', programId);

  if (error) {
    logger.error('Error fetching completion stats:', error);
    return {
      totalEnrolled: 0,
      completed: 0,
      inProgress: 0,
      averageProgress: 0,
      completionRate: 0,
    };
  }

  const enrollments = data || [];
  const completed = enrollments.filter((e) => e.status === 'completed').length;
  const inProgress = enrollments.filter((e) => e.status === 'active').length;
  const totalProgress = enrollments.reduce(
    (sum, e) => sum + (e.student_risk_status?.progress_percentage || 0),
    0
  );
  const averageProgress =
    enrollments.length > 0 ? Math.round(totalProgress / enrollments.length) : 0;
  const completionRate =
    enrollments.length > 0
      ? Math.round((completed / enrollments.length) * 100)
      : 0;

  return {
    totalEnrolled: enrollments.length,
    completed,
    inProgress,
    averageProgress,
    completionRate,
  };
}
