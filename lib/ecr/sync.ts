// lib/ecr/sync.ts
// Electronic Completion Record (ECR) — hour tracking for state board reporting.
// Theory hours come from Elevate LMS lesson_progress.
// Practical (OJT) hours come from student_hours (shop-logged, supervisor-approved).

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export interface ECRRecord {
  studentId: string;
  enrollmentId: string;
  programId: string;
  theoryHours: number;
  practicalHours: number;
  totalHours: number;
  lastSyncedAt: Date;
}

/**
 * Sync progress for a single student from Elevate LMS + approved OJT hours.
 */
export async function syncStudentProgress(
  studentId: string,
): Promise<ECRRecord | null> {
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, program_id, programs(total_hours)')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .maybeSingle();

  if (!enrollment) return null;

  // Theory hours: count completed lessons in Elevate LMS
  const { count: completedLessons } = await supabase
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', studentId)
    .eq('completed', true);

  // Each completed lesson ≈ 1 hour (adjust per program config as needed)
  const theoryHours = completedLessons ?? 0;

  // Practical hours: approved OJT entries
  const { data: practicalRows } = await supabase
    .from('student_hours')
    .select('hours')
    .eq('student_id', studentId)
    .eq('enrollment_id', enrollment.id)
    .eq('approved', true);

  const practicalHours = practicalRows?.reduce((sum: number, h: any) => sum + (h.hours ?? 0), 0) ?? 0;
  const totalHours = theoryHours + practicalHours;

  const requiredHours = (enrollment as any).programs?.total_hours ?? 0;
  const progressPercentage = requiredHours > 0
    ? Math.round((totalHours / requiredHours) * 100)
    : 0;

  await supabase
    .from('program_enrollments')
    .update({
      progress_percentage: progressPercentage,
      theory_hours_completed: theoryHours,
      practical_hours_completed: practicalHours,
      total_hours_completed: totalHours,
      last_progress_update: new Date().toISOString(),
    })
    .eq('id', enrollment.id);

  await supabase.from('ecr_snapshots').insert({
    student_id: studentId,
    enrollment_id: enrollment.id,
    theory_hours: theoryHours,
    practical_hours: practicalHours,
    total_hours: totalHours,
    progress_percentage: progressPercentage,
    snapshot_date: new Date().toISOString(),
  });

  return {
    studentId,
    enrollmentId: enrollment.id,
    programId: enrollment.program_id,
    theoryHours,
    practicalHours,
    totalHours,
    lastSyncedAt: new Date(),
  };
}

/** @deprecated Use syncStudentProgress */
/** @deprecated Use syncStudentProgress */
export const syncStudentMiladyProgress = syncStudentProgress;

/**
 * Sync all active students.
 */
export async function syncAllStudents(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  const supabase = await createClient();

  const { data: activeEnrollments } = await supabase
    .from('program_enrollments')
    .select('student_id')
    .eq('status', 'active');

  if (!activeEnrollments?.length) return { success: 0, failed: 0, total: 0 };

  const uniqueStudentIds = [...new Set(activeEnrollments.map((e: any) => e.student_id))];
  let success = 0;
  let failed = 0;

  for (const studentId of uniqueStudentIds) {
    try {
      await syncStudentProgress(studentId as string);
      success++;
    } catch (err) {
      logger.error(`ECR sync failed for student ${studentId}:`, err);
      failed++;
    }
  }

  await supabase.from('ecr_sync_logs').insert({
    total_students: uniqueStudentIds.length,
    successful: success,
    failed,
    sync_date: new Date().toISOString(),
  });

  return { success, failed, total: uniqueStudentIds.length };
}

/**
 * Generate ECR report for state board submission.
 */
export async function generateECRReport(studentId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', studentId)
    .single();

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, program_id, programs(name, total_hours)')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .maybeSingle();

  if (!profile || !enrollment) throw new Error('Student or enrollment not found');

  const { count: theoryHours } = await supabase
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', studentId)
    .eq('completed', true);

  const { data: practicalRows } = await supabase
    .from('student_hours')
    .select('date, activity_type, hours, profiles!student_hours_supervisor_id_fkey(full_name)')
    .eq('student_id', studentId)
    .eq('enrollment_id', enrollment.id)
    .eq('approved', true)
    .order('date', { ascending: false });

  const practicalHoursTotal = practicalRows?.reduce((sum: number, h: any) => sum + (h.hours ?? 0), 0) ?? 0;
  const theory = theoryHours ?? 0;
  const totalHours = theory + practicalHoursTotal;
  const requiredHours = (enrollment as any).programs?.total_hours ?? 0;
  const percentage = requiredHours > 0 ? Math.round((totalHours / requiredHours) * 100) : 0;

  return {
    student: {
      name: profile.full_name ?? 'Unknown',
      email: profile.email ?? '',
      studentId: profile.id,
    },
    program: {
      name: (enrollment as any).programs?.name ?? 'Unknown Program',
      requiredHours,
    },
    hours: {
      theory,
      practical: practicalHoursTotal,
      total: totalHours,
      percentage,
    },
    practicalActivities: practicalRows?.map((h: any) => ({
      date: h.date,
      activity: h.activity_type ?? 'Unknown',
      hours: h.hours ?? 0,
      supervisor: h.profiles?.full_name ?? 'Unknown',
    })) ?? [],
    generatedAt: new Date(),
  };
}
