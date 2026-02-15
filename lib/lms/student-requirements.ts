import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export interface StudentRequirement {
  id: string;
  enrollment_id: string;
  requirement_type: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  evidence_url: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskStatus {
  id: string;
  enrollment_id: string;
  status: 'on_track' | 'needs_action' | 'at_risk';
  overdue_count: number;
  pending_count: number;
  completed_count: number;
  total_count: number;
  progress_percentage: number;
  last_activity_date: string | null;
  days_since_activity: number;
  has_critical_overdue: boolean;
  calculated_at: string;
}

/**
 * Get all requirements for a student enrollment
 */
export async function getStudentRequirements(enrollmentId: string): Promise<StudentRequirement[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('student_requirements')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true });

  if (error) {
    logger.error('Error fetching student requirements:', error);
    return [];
  }

  return data || [];
}

/**
 * Get risk status for a student enrollment
 */
export async function getStudentRiskStatus(enrollmentId: string): Promise<RiskStatus | null> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('student_risk_status')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .single();

  if (error) {
    logger.error('Error fetching risk status:', error);
    return null;
  }

  return data;
}

/**
 * Update requirement status
 */
export async function updateRequirementStatus(
  requirementId: string,
  status: string,
  evidenceUrl?: string
): Promise<boolean> {
  const supabase = await createClient();

  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (evidenceUrl) {
    updateData.evidence_url = evidenceUrl;
  }

  const { error } = await supabase
    .from('student_requirements')
    .update(updateData)
    .eq('id', requirementId);

  if (error) {
    logger.error('Error updating requirement:', error);
    return false;
  }

  return true;
}

/**
 * Verify a requirement (program holder/admin action)
 */
export async function verifyRequirement(
  requirementId: string,
  verifiedBy: string,
  approved: boolean,
  rejectionReason?: string
): Promise<boolean> {
  const supabase = await createClient();

  const updateData: any = {
    status: approved ? 'verified' : 'rejected',
    verified_by: verifiedBy,
    verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (!approved && rejectionReason) {
    updateData.rejection_reason = rejectionReason;
  }

  const { error } = await supabase
    .from('student_requirements')
    .update(updateData)
    .eq('id', requirementId);

  if (error) {
    logger.error('Error verifying requirement:', error);
    return false;
  }

  // Log verification action
  await supabase
    .from('verification_actions')
    .insert({
      requirement_id: requirementId,
      action_type: approved ? 'approved' : 'rejected',
      performed_by: verifiedBy,
      notes: rejectionReason || null
    });

  return true;
}

/**
 * Create a new requirement
 */
export async function createRequirement(
  enrollmentId: string,
  requirementType: string,
  title: string,
  description?: string,
  dueDate?: string,
  priority: string = 'normal'
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('student_requirements')
    .insert({
      enrollment_id: enrollmentId,
      requirement_type: requirementType,
      title,
      description,
      due_date: dueDate,
      priority,
      status: 'pending'
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Error creating requirement:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Get overdue requirements for a student
 */
export async function getOverdueRequirements(enrollmentId: string): Promise<StudentRequirement[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('student_requirements')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .in('status', ['pending', 'in_progress'])
    .lt('due_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  if (error) {
    logger.error('Error fetching overdue requirements:', error);
    return [];
  }

  return data || [];
}

/**
 * Get pending verifications for program holder
 */
export async function getPendingVerifications(programIds: string[]): Promise<StudentRequirement[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('student_requirements')
    .select(`
      *,
      enrollments!inner(
        program_id,
        profiles!enrollments_student_id_fkey(
          first_name,
          last_name,
          email
        )
      )
    `)
    .in('enrollments.program_id', programIds)
    .eq('status', 'completed')
    .order('updated_at', { ascending: true });

  if (error) {
    logger.error('Error fetching pending verifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Calculate and update risk status for an enrollment
 */
export async function recalculateRiskStatus(enrollmentId: string): Promise<void> {
  const supabase = await createClient();

  // Call the database function
  await supabase.rpc('calculate_student_risk_status', {
    p_enrollment_id: enrollmentId
  });
}
