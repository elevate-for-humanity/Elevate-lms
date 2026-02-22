/**
 * Cohort System - Groups students by program and enrollment period
 * Auto-generated from enrollment data
 */

import { createClient } from '@/lib/supabase/server';

export interface Cohort {
  id: string;
  name: string;
  program_id: string;
  program_name: string;
  start_month: string; // e.g., "2026-01"
  member_count: number;
  on_track_count: number;
  at_risk_count: number;
  completed_count: number;
  completion_rate: number;
  next_milestone?: string;
}

export interface CohortMember {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  enrolled_at: string;
  progress_percent: number;
  hours_completed: number;
  hours_required: number;
  status: 'on_track' | 'at_risk' | 'completed' | 'inactive';
  last_activity?: string;
}

/**
 * Get cohorts for a program (auto-grouped by enrollment month)
 */
export async function getProgramCohorts(programId: string): Promise<Cohort[]> {
  const supabase = await createClient();

  // Get all enrollments for this program
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      user_id,
      created_at,
      status,
      progress,
      programs(id, name, total_hours)
    `)
    .eq('program_id', programId)
    .order('created_at', { ascending: false });

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  // Group by month
  const cohortMap = new Map<string, any[]>();
  
  for (const enrollment of enrollments) {
    const date = new Date(enrollment.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!cohortMap.has(monthKey)) {
      cohortMap.set(monthKey, []);
    }
    cohortMap.get(monthKey)!.push(enrollment);
  }

  // Build cohort objects
  const cohorts: Cohort[] = [];
  const program = (enrollments[0].programs as any);

  for (const [monthKey, members] of cohortMap) {
    const date = new Date(monthKey + '-01');
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const onTrack = members.filter(m => m.status === 'active' && (m.progress || 0) >= 50).length;
    const atRisk = members.filter(m => m.status === 'active' && (m.progress || 0) < 50).length;
    const completed = members.filter(m => m.status === 'completed').length;

    cohorts.push({
      id: `${programId}-${monthKey}`,
      name: `${program?.name || 'Program'} - ${monthName}`,
      program_id: programId,
      program_name: program?.name || 'Program',
      start_month: monthKey,
      member_count: members.length,
      on_track_count: onTrack,
      at_risk_count: atRisk,
      completed_count: completed,
      completion_rate: members.length > 0 ? Math.round((completed / members.length) * 100) : 0,
    });
  }

  return cohorts.sort((a, b) => b.start_month.localeCompare(a.start_month));
}

/**
 * Get members of a specific cohort
 */
export async function getCohortMembers(programId: string, startMonth: string): Promise<CohortMember[]> {
  const supabase = await createClient();

  const startDate = new Date(startMonth + '-01');
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      user_id,
      created_at,
      status,
      progress,
      profiles!enrollments_user_id_fkey(full_name, avatar_url),
      programs(total_hours)
    `)
    .eq('program_id', programId)
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (!enrollments) return [];

  const members: CohortMember[] = [];

  for (const e of enrollments) {
    const profile = e.profiles as any;
    const program = e.programs as any;
    const progress = e.progress || 0;
    const hoursRequired = program?.total_hours || 200;
    const hoursCompleted = Math.round((progress / 100) * hoursRequired);

    let status: CohortMember['status'] = 'on_track';
    if (e.status === 'completed') {
      status = 'completed';
    } else if (progress < 25) {
      status = 'at_risk';
    } else if (e.status === 'inactive') {
      status = 'inactive';
    }

    members.push({
      id: e.id,
      user_id: e.user_id,
      full_name: profile?.full_name || 'Student',
      avatar_url: profile?.avatar_url,
      enrolled_at: e.created_at,
      progress_percent: progress,
      hours_completed: hoursCompleted,
      hours_required: hoursRequired,
      status,
    });
  }

  return members;
}

/**
 * Get user's cohort
 */
export async function getUserCohort(userId: string): Promise<Cohort | null> {
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      program_id,
      created_at,
      programs(name)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!enrollment) return null;

  const date = new Date(enrollment.created_at);
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const cohorts = await getProgramCohorts(enrollment.program_id);
  return cohorts.find(c => c.start_month === monthKey) || null;
}

/**
 * Get all active cohorts across programs
 */
export async function getAllActiveCohorts(limit = 10): Promise<Cohort[]> {
  const supabase = await createClient();

  // Get distinct programs with active enrollments
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name')
    .eq('is_active', true)
    .limit(20);

  if (!programs) return [];

  const allCohorts: Cohort[] = [];

  for (const program of programs) {
    const cohorts = await getProgramCohorts(program.id);
    allCohorts.push(...cohorts.slice(0, 2)); // Latest 2 cohorts per program
  }

  return allCohorts
    .sort((a, b) => b.start_month.localeCompare(a.start_month))
    .slice(0, limit);
}
