import { createClient } from '@/lib/supabase/server';

export interface AtRiskStudent {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  program_name: string;
  funding_source: string | null;
  risk_status: string;
  overdue_count: number;
  progress_percentage: number;
  days_since_activity: number;
  last_activity_date: string | null;
  has_critical_overdue: boolean;
}

/**
 * Get all at-risk students across all programs.
 * Canonical risk statuses are: critical, at_risk, watch, on_track.
 */
export async function getAtRiskStudents(): Promise<AtRiskStudent[]> {
  const supabase = await createClient();

  const { data }: any = await supabase
    .from('student_risk_status')
    .select(
      `
      *,
      enrollments (
        id,
        student_id,
        profiles!enrollments_student_id_fkey (
          first_name,
          last_name,
          email,
          phone
        ),
        programs (
          name
        ),
        student_funding_assignments (
          funding_sources (
            code
          )
        )
      )
    `,
    )
    .in('status', ['critical', 'at_risk'])
    .order('overdue_count', { ascending: false });

  if (!data) {
    return [];
  }

  return data.map((risk: any) => {
    const enrollment = risk.enrollments;
    const student = enrollment?.profiles;
    const funding = enrollment?.student_funding_assignments?.[0]?.funding_sources;

    return {
      enrollment_id: enrollment?.id || '',
      student_id: enrollment?.student_id || '',
      student_name: `${student?.first_name} ${student?.last_name}`,
      student_email: student?.email || '',
      student_phone: student?.phone || null,
      program_name: enrollment?.programs?.name || '',
      funding_source: funding?.code || null,
      risk_status: risk.status,
      overdue_count: risk.overdue_count,
      progress_percentage: risk.progress_percentage,
      days_since_activity: Number(risk.days_since_activity ?? 0),
      last_activity_date: risk.last_activity_date,
      has_critical_overdue: Boolean(risk.has_critical_overdue),
    };
  });
}

/**
 * Get students who need attention but have not crossed into at-risk/critical.
 */
export async function getNeedsActionStudents(): Promise<AtRiskStudent[]> {
  const supabase = await createClient();

  const { data }: any = await supabase
    .from('student_risk_status')
    .select(
      `
      *,
      enrollments (
        id,
        student_id,
        profiles!enrollments_student_id_fkey (
          first_name,
          last_name,
          email,
          phone
        ),
        programs (
          name
        ),
        student_funding_assignments (
          funding_sources (
            code
          )
        )
      )
    `,
    )
    .eq('status', 'watch')
    .order('overdue_count', { ascending: false });

  if (!data) {
    return [];
  }

  return data.map((risk: any) => {
    const enrollment = risk.enrollments;
    const student = enrollment?.profiles;
    const funding = enrollment?.student_funding_assignments?.[0]?.funding_sources;

    return {
      enrollment_id: enrollment?.id || '',
      student_id: enrollment?.student_id || '',
      student_name: `${student?.first_name} ${student?.last_name}`,
      student_email: student?.email || '',
      student_phone: student?.phone || null,
      program_name: enrollment?.programs?.name || '',
      funding_source: funding?.code || null,
      risk_status: risk.status,
      overdue_count: risk.overdue_count,
      progress_percentage: risk.progress_percentage,
      days_since_activity: Number(risk.days_since_activity ?? 0),
      last_activity_date: risk.last_activity_date,
      has_critical_overdue: Boolean(risk.has_critical_overdue),
    };
  });
}

/**
 * Get inactive students (no activity in X days)
 */
export async function getInactiveStudents(
  daysSinceActivity: number = 14,
): Promise<AtRiskStudent[]> {
  const supabase = await createClient();

  const { data }: any = await supabase
    .from('student_risk_status')
    .select(
      `
      *,
      enrollments (
        id,
        student_id,
        status,
        profiles!enrollments_student_id_fkey (
          first_name,
          last_name,
          email,
          phone
        ),
        programs (
          name
        )
      )
    `,
    )
    .eq('enrollments.status', 'active')
    .gte('days_since_activity', daysSinceActivity)
    .order('days_since_activity', { ascending: false });

  if (!data) {
    return [];
  }

  return data.map((risk: any) => {
    const enrollment = risk.enrollments;
    const student = enrollment?.profiles;

    return {
      enrollment_id: enrollment?.id || '',
      student_id: enrollment?.student_id || '',
      student_name: `${student?.first_name} ${student?.last_name}`,
      student_email: student?.email || '',
      student_phone: student?.phone || null,
      program_name: enrollment?.programs?.name || '',
      funding_source: null,
      risk_status: risk.status,
      overdue_count: risk.overdue_count,
      progress_percentage: risk.progress_percentage,
      days_since_activity: Number(risk.days_since_activity ?? 0),
      last_activity_date: risk.last_activity_date,
      has_critical_overdue: Boolean(risk.has_critical_overdue),
    };
  });
}

/**
 * Get programs with low completion rates
 */
export async function getLowCompletionPrograms(threshold: number = 70): Promise<any[]> {
  const supabase = await createClient();

  const { data: programs } = await supabase.from('programs').select(`
      id,
      name,
      enrollments (
        id,
        status
      )
    `);

  if (!programs) {
    return [];
  }

  const programStats = programs.map((program: any) => {
    const enrollments = program.enrollments || [];
    const total = enrollments.length;
    const completed = enrollments.filter((e: any) => e.status === 'completed').length;
    const dropped = enrollments.filter((e: any) => e.status === 'dropped').length;
    const active = enrollments.filter((e: any) => e.status === 'active').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const dropoutRate = total > 0 ? Math.round((dropped / total) * 100) : 0;

    return {
      id: program.id,
      name: program.name,
      total_enrollments: total,
      active_students: active,
      completed_students: completed,
      dropped_students: dropped,
      completion_rate: completionRate,
      dropout_rate: dropoutRate,
    };
  });

  return programStats
    .filter((p) => p.completion_rate < threshold && p.total_enrollments >= 5)
    .sort((a, b) => a.completion_rate - b.completion_rate);
}

/**
 * Get funding source performance metrics
 */
export async function getFundingSourceMetrics(): Promise<any[]> {
  const supabase = await createClient();

  const { data: fundingSources } = await supabase
    .from('funding_sources')
    .select(
      `
      id,
      name,
      code,
      student_funding_assignments (
        enrollments (
          id,
          status,
          student_risk_status (
            status
          )
        )
      )
    `,
    )
    .eq('active', true);

  if (!fundingSources) {
    return [];
  }

  return fundingSources
    .map((source: any) => {
      const assignments = source.student_funding_assignments || [];
      const enrollments = assignments.map((a: any) => a.enrollments).filter(Boolean);

      const total = enrollments.length;
      const active = enrollments.filter((e: any) => e.status === 'active').length;
      const completed = enrollments.filter((e: any) => e.status === 'completed').length;
      const atRisk = enrollments.filter((e: any) =>
        ['critical', 'at_risk'].includes(e.student_risk_status?.[0]?.status),
      ).length;
      const onTrack = enrollments.filter(
        (e: any) => e.student_risk_status?.[0]?.status === 'on_track',
      ).length;

      return {
        funding_source: source.code,
        funding_name: source.name,
        total_students: total,
        active_students: active,
        completed_students: completed,
        at_risk_students: atRisk,
        on_track_students: onTrack,
        completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    })
    .filter((m) => m.total_students > 0);
}

/**
 * Detect students with missing critical requirements
 */
export async function getStudentsWithMissingCriticalRequirements(): Promise<any[]> {
  const supabase = await createClient();

  const { data }: any = await supabase
    .from('student_requirements')
    .select(
      `
      *,
      enrollments (
        id,
        profiles!enrollments_student_id_fkey (
          first_name,
          last_name,
          email
        ),
        programs (
          name
        )
      )
    `,
    )
    .eq('priority', 'urgent')
    .in('status', ['pending', 'in_progress'])
    .lt('due_date', new Date().toISOString().split('T')[0]);

  if (!data) {
    return [];
  }

  const grouped = data.reduce((acc: any, req: any) => {
    const enrollmentId = req.enrollment_id;
    if (!acc[enrollmentId]) {
      acc[enrollmentId] = {
        enrollment_id: enrollmentId,
        student_name: `${req.enrollments?.profiles?.first_name} ${req.enrollments?.profiles?.last_name}`,
        student_email: req.enrollments?.profiles?.email,
        program_name: req.enrollments?.programs?.name,
        critical_requirements: [],
      };
    }
    acc[enrollmentId].critical_requirements.push({
      title: req.title,
      due_date: req.due_date,
    });
    return acc;
  }, {});

  return Object.values(grouped);
}
