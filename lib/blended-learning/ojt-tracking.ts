/**
 * On-the-Job Training (OJT) Tracking System
 * Hours logging, employer verification, and progress monitoring
 */
import { createClient } from '@/lib/supabase/server';
export interface OJTPlacement {
  id: string;
  student_id: string;
  program_id: string;
  employer_name: string;
  employer_contact_name: string;
  employer_contact_email: string;
  employer_contact_phone: string;
  job_title: string;
  start_date: string;
  end_date?: string;
  hours_required: number;
  hourly_wage?: number;
  supervisor_name: string;
  supervisor_email: string;
  supervisor_phone: string;
  work_schedule: string;
  status: 'active' | 'completed' | 'terminated';
  created_at: string;
  updated_at: string;
}
export interface OJTHoursLog {
  id: string;
  placement_id: string;
  student_id: string;
  work_date: string;
  hours_worked: number;
  tasks_performed: string;
  skills_practiced: string[];
  student_notes?: string;
  supervisor_verified: boolean;
  supervisor_signature?: string;
  supervisor_comments?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}
export interface OJTProgressSummary {
  placement_id: string;
  student_id: string;
  hours_required: number;
  hours_logged: number;
  hours_verified: number;
  hours_remaining: number;
  completion_percentage: number;
  weeks_active: number;
  average_hours_per_week: number;
  estimated_completion_date?: string;
  status: 'on_track' | 'behind' | 'ahead' | 'completed';
}
/**
 * Create OJT placement
 */
export async function createOJTPlacement(data: {
  student_id: string;
  program_id: string;
  employer_name: string;
  employer_contact_name: string;
  employer_contact_email: string;
  employer_contact_phone: string;
  job_title: string;
  start_date: string;
  hours_required: number;
  hourly_wage?: number;
  supervisor_name: string;
  supervisor_email: string;
  supervisor_phone: string;
  work_schedule: string;
}): Promise<OJTPlacement> {
  const supabase = await createClient();
  const { data: placement, error } = await supabase
    .from('ojt_placements')
    .insert({
      ...data,
      status: 'active',
    })
    .select()
    .single();
  if (error) throw error;
  // Send notification to supervisor
  await sendSupervisorWelcomeEmail(placement);
  return placement;
}
/**
 * Log OJT hours (student submission)
 */
export async function logOJTHours(data: {
  placement_id: string;
  student_id: string;
  work_date: string;
  hours_worked: number;
  tasks_performed: string;
  skills_practiced: string[];
  student_notes?: string;
}): Promise<OJTHoursLog> {
  const supabase = await createClient();
  // Validate placement is active
  const { data: placement } = await supabase
    .from('ojt_placements')
    .select('*')
    .eq('id', data.placement_id)
    .eq('status', 'active')
    .single();
  if (!placement) {
    throw new Error('Placement not found or not active');
  }
  // Check for duplicate entry
  const { data: existing } = await supabase
    .from('ojt_hours_log')
    .select('*')
    .eq('placement_id', data.placement_id)
    .eq('work_date', data.work_date)
    .single();
  if (existing) {
    throw new Error('Hours already logged for this date');
  }
  const { data: log, error } = await supabase
    .from('ojt_hours_log')
    .insert({
      ...data,
      supervisor_verified: false,
    })
    .select()
    .single();
  if (error) throw error;
  // Send notification to supervisor for verification
  await sendVerificationRequest(log, placement);
  return log;
}
/**
 * Supervisor verifies hours
 */
export async function verifyOJTHours(
  log_id: string,
  supervisor_email: string,
  supervisor_comments?: string
): Promise<OJTHoursLog> {
  const supabase = await createClient();
  // Verify supervisor email matches placement
  const { data: log } = await supabase
    .from('ojt_hours_log')
    .select('*, ojt_placements(*)')
    .eq('id', log_id)
    .single();
  if (!log) {
    throw new Error('Hours log not found');
  }
  if (log.ojt_placements.supervisor_email !== supervisor_email) {
    throw new Error('Unauthorized: Email does not match supervisor');
  }
  const { data: verified, error } = await supabase
    .from('ojt_hours_log')
    .update({
      supervisor_verified: true,
      supervisor_signature: supervisor_email,
      supervisor_comments,
      verified_at: new Date().toISOString(),
    })
    .eq('id', log_id)
    .select()
    .single();
  if (error) throw error;
  // Check if placement is complete
  await checkPlacementCompletion(log.placement_id);
  return verified;
}
/**
 * Get OJT progress summary
 */
export async function getOJTProgress(placement_id: string): Promise<OJTProgressSummary> {
  const supabase = await createClient();
  const { data: placement } = await supabase
    .from('ojt_placements')
    .select('*')
    .eq('id', placement_id)
    .single();
  if (!placement) {
    throw new Error('Placement not found');
  }
  const { data: logs } = await supabase
    .from('ojt_hours_log')
    .select('*')
    .eq('placement_id', placement_id);
  const hours_logged = logs?.reduce((sum, log) => sum + log.hours_worked, 0) || 0;
  const hours_verified = logs?.filter(log => log.supervisor_verified)
    .reduce((sum, log) => sum + log.hours_worked, 0) || 0;
  const hours_remaining = Math.max(0, placement.hours_required - hours_verified);
  const completion_percentage = (hours_verified / placement.hours_required) * 100;
  // Calculate weeks active
  const start = new Date(placement.start_date);
  const now = new Date();
  const weeks_active = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const average_hours_per_week = weeks_active > 0 ? hours_verified / weeks_active : 0;
  // Estimate completion date
  let estimated_completion_date;
  if (average_hours_per_week > 0 && hours_remaining > 0) {
    const weeks_remaining = hours_remaining / average_hours_per_week;
    const completion = new Date(now.getTime() + weeks_remaining * 7 * 24 * 60 * 60 * 1000);
    estimated_completion_date = completion.toISOString().split('T')[0];
  }
  // Determine status
  let status: 'on_track' | 'behind' | 'ahead' | 'completed' = 'on_track';
  if (completion_percentage >= 100) {
    status = 'completed';
  } else if (average_hours_per_week < 20 && weeks_active > 2) {
    status = 'behind';
  } else if (average_hours_per_week > 30) {
    status = 'ahead';
  }
  return {
    placement_id,
    student_id: placement.student_id,
    hours_required: placement.hours_required,
    hours_logged,
    hours_verified,
    hours_remaining,
    completion_percentage,
    weeks_active,
    average_hours_per_week,
    estimated_completion_date,
    status,
  };
}
/**
 * Get all OJT placements for student
 */
export async function getStudentOJTPlacements(student_id: string): Promise<OJTPlacement[]> {
  const supabase = await createClient();
  const { data: placements } = await supabase
    .from('ojt_placements')
    .select('*')
    .eq('student_id', student_id)
    .order('start_date', { ascending: false });
  return placements || [];
}
/**
 * Get hours logs for placement
 */
export async function getPlacementHoursLogs(placement_id: string): Promise<OJTHoursLog[]> {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from('ojt_hours_log')
    .select('*')
    .eq('placement_id', placement_id)
    .order('work_date', { ascending: false });
  return logs || [];
}
/**
 * Get unverified hours for supervisor
 */
export async function getUnverifiedHours(supervisor_email: string): Promise<OJTHoursLog[]> {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from('ojt_hours_log')
    .select('*, ojt_placements(*), profiles(full_name)')
    .eq('supervisor_verified', false)
    .eq('ojt_placements.supervisor_email', supervisor_email)
    .order('work_date', { ascending: true });
  return logs || [];
}
/**
 * Complete OJT placement
 */
export async function completeOJTPlacement(
  placement_id: string,
  end_date: string
): Promise<OJTPlacement> {
  const supabase = await createClient();
  const progress = await getOJTProgress(placement_id);
  if (progress.hours_verified < progress.hours_required) {
    throw new Error('Required hours not completed');
  }
  const { data: placement, error } = await supabase
    .from('ojt_placements')
    .update({
      status: 'completed',
      end_date,
    })
    .eq('id', placement_id)
    .select()
    .single();
  if (error) throw error;
  // Send completion notification
  await sendCompletionNotification(placement);
  return placement;
}
/**
 * Terminate OJT placement
 */
export async function terminateOJTPlacement(
  placement_id: string,
  reason: string
): Promise<OJTPlacement> {
  const supabase = await createClient();
  const { data: placement, error } = await supabase
    .from('ojt_placements')
    .update({
      status: 'terminated',
      end_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', placement_id)
    .select()
    .single();
  if (error) throw error;
  // Log termination reason
  await supabase
    .from('ojt_notes')
    .insert({
      placement_id,
      note_type: 'termination',
      note: reason,
    });
  return placement;
}
/**
 * Generate OJT report for program
 */
export async function generateOJTReport(program_id: string): Promise<any> {
  const supabase = await createClient();
  const { data: placements } = await supabase
    .from('ojt_placements')
    .select(`
      *,
      profiles(full_name, email),
      ojt_hours_logs(*)
    `)
    .eq('program_id', program_id);
  if (!placements) return [];
  const report = [];
  for (const placement of placements) {
    const progress = await getOJTProgress(placement.id);
    report.push({
      ...placement,
      progress,
    });
  }
  return report;
}
/**
 * Check if placement is complete and update status
 */
async function checkPlacementCompletion(placement_id: string): Promise<void> {
  const progress = await getOJTProgress(placement_id);
  if (progress.hours_verified >= progress.hours_required) {
    await completeOJTPlacement(placement_id, new Date().toISOString().split('T')[0]);
  }
}
/**
 * Send welcome email to supervisor
 */
async function sendSupervisorWelcomeEmail(placement: OJTPlacement): Promise<void> {
  // Implementation would use email service
}
/**
 * Send verification request to supervisor
 */
async function sendVerificationRequest(log: OJTHoursLog, placement: OJTPlacement): Promise<void> {
  // Implementation would use email service
}
/**
 * Send completion notification
 */
async function sendCompletionNotification(placement: OJTPlacement): Promise<void> {
  // Implementation would use email service
}
