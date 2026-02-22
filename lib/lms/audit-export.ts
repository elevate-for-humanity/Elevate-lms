import { createClient } from '@/lib/supabase/server';
import { toCsv } from '@/lib/reports/exportCsv';

export interface AuditExportData {
  student_id: string;
  student_name: string;
  student_email: string;
  program_name: string;
  enrollment_date: string;
  status: string;
  funding_source: string;
  progress_percentage: number;
  requirements_total: number;
  requirements_completed: number;
  requirements_overdue: number;
  last_activity_date: string | null;
  completion_date: string | null;
}

/**
 * Generate audit export for a program
 */
export async function generateProgramAuditExport(
  programId: string
): Promise<string> {
  const supabase = await createClient();

  // Fetch all enrollments for the program with related data
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(
      `
      id,
      student_id,
      start_date,
      actual_completion_date,
      status,
      profiles!enrollments_student_id_fkey (
        first_name,
        last_name,
        email
      ),
      programs (
        name
      ),
      student_funding_assignments (
        funding_sources (
          code
        )
      ),
      student_risk_status (
        progress_percentage,
        total_count,
        completed_count,
        overdue_count,
        last_activity_date
      )
    `
    )
    .eq('program_id', programId);

  if (!enrollments) {
    return '';
  }

  // Transform data for export
  const exportData: AuditExportData[] = enrollments.map((enrollment: any) => {
    const riskStatus = enrollment.student_risk_status?.[0];
    const funding =
      enrollment.student_funding_assignments?.[0]?.funding_sources;

    return {
      student_id: enrollment.student_id,
      student_name: `${enrollment.profiles?.first_name} ${enrollment.profiles?.last_name}`,
      student_email: enrollment.profiles?.email || '',
      program_name: enrollment.programs?.name || '',
      enrollment_date: enrollment.start_date || '',
      status: enrollment.status,
      funding_source: funding?.code || 'N/A',
      progress_percentage: riskStatus?.progress_percentage || 0,
      requirements_total: riskStatus?.total_count || 0,
      requirements_completed: riskStatus?.completed_count || 0,
      requirements_overdue: riskStatus?.overdue_count || 0,
      last_activity_date: riskStatus?.last_activity_date || null,
      completion_date: enrollment.actual_completion_date || null,
    };
  });

  return toCsv(exportData);
}

/**
 * Generate audit export for a funding source
 */
export async function generateFundingSourceAuditExport(
  fundingSourceCode: string
): Promise<string> {
  const supabase = await createClient();

  // Get funding source ID
  const { data: fundingSource } = await supabase
    .from('funding_sources')
    .select('id')
    .eq('code', fundingSourceCode)
    .single();

  if (!fundingSource) {
    return '';
  }

  // Fetch enrollments with this funding source
  const { data: assignments } = await supabase
    .from('student_funding_assignments')
    .select(
      `
      enrollment_id,
      enrollments (
        id,
        student_id,
        start_date,
        actual_completion_date,
        status,
        profiles!enrollments_student_id_fkey (
          first_name,
          last_name,
          email
        ),
        programs (
          name
        ),
        student_risk_status (
          progress_percentage,
          total_count,
          completed_count,
          overdue_count,
          last_activity_date
        )
      )
    `
    )
    .eq('funding_source_id', fundingSource.id);

  if (!assignments) {
    return '';
  }

  // Transform data
  const exportData: AuditExportData[] = assignments.map((assignment: any) => {
    const enrollment = assignment.enrollments;
    const riskStatus = enrollment?.student_risk_status?.[0];

    return {
      student_id: enrollment?.student_id || '',
      student_name: `${enrollment?.profiles?.first_name} ${enrollment?.profiles?.last_name}`,
      student_email: enrollment?.profiles?.email || '',
      program_name: enrollment?.programs?.name || '',
      enrollment_date: enrollment?.start_date || '',
      status: enrollment?.status || '',
      funding_source: fundingSourceCode,
      progress_percentage: riskStatus?.progress_percentage || 0,
      requirements_total: riskStatus?.total_count || 0,
      requirements_completed: riskStatus?.completed_count || 0,
      requirements_overdue: riskStatus?.overdue_count || 0,
      last_activity_date: riskStatus?.last_activity_date || null,
      completion_date: enrollment?.actual_completion_date || null,
    };
  });

  return toCsv(exportData);
}

/**
 * Generate detailed requirement evidence export for a student
 */
export async function generateStudentEvidenceExport(
  enrollmentId: string
): Promise<string> {
  const supabase = await createClient();

  const { data: requirements } = await supabase
    .from('student_requirements')
    .select(
      `
      *,
      enrollments (
        profiles!enrollments_student_id_fkey (
          first_name,
          last_name,
          email
        ),
        programs (
          name
        )
      )
    `
    )
    .eq('enrollment_id', enrollmentId)
    .order('created_at', { ascending: true });

  if (!requirements) {
    return '';
  }

  const exportData = requirements.map((req: any) => ({
    student_name: `${req.enrollments?.profiles?.first_name} ${req.enrollments?.profiles?.last_name}`,
    program_name: req.enrollments?.programs?.name || '',
    requirement_type: req.requirement_type,
    requirement_title: req.title,
    description: req.description || '',
    due_date: req.due_date || '',
    priority: req.priority,
    status: req.status,
    evidence_url: req.evidence_url || '',
    verified_at: req.verified_at || '',
    created_at: req.created_at,
    completed_at: req.updated_at,
  }));

  return toCsv(exportData);
}

/**
 * Generate compliance report for all programs
 */
export async function generateComplianceReport(): Promise<string> {
  const supabase = await createClient();

  // Get all programs with enrollment stats
  const { data: programs } = await supabase.from('programs').select(`
      id,
      name,
      enrollments (
        id,
        status,
        student_risk_status (
          status,
          progress_percentage
        )
      )
    `);

  if (!programs) {
    return '';
  }

  const reportData = programs.map((program: any) => {
    const enrollments = program.enrollments || [];
    const total = enrollments.length;
    const active = enrollments.filter((e: any) => e.status === 'active').length;
    const completed = enrollments.filter(
      (e: any) => e.status === 'completed'
    ).length;
    const dropped = enrollments.filter(
      (e: any) => e.status === 'dropped'
    ).length;
    const atRisk = enrollments.filter(
      (e: any) => e.student_risk_status?.[0]?.status === 'at_risk'
    ).length;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    const dropoutRate = total > 0 ? Math.round((dropped / total) * 100) : 0;

    return {
      program_name: program.name,
      total_enrollments: total,
      active_students: active,
      completed_students: completed,
      dropped_students: dropped,
      at_risk_students: atRisk,
      completion_rate: `${completionRate}%`,
      dropout_rate: `${dropoutRate}%`,
    };
  });

  return toCsv(reportData);
}
