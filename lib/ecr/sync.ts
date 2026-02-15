import { logger } from '@/lib/logger';
// lib/ecr/sync.ts
// Electronic Completion Record (ECR) Sync System
// Syncs hour tracking data from Milady CIMA to internal reporting

import { createClient } from '@/lib/supabase/server';
import { MiladyAPI } from '@/lib/partners/milady';

export interface ECRRecord {
  studentId: string;
  enrollmentId: string;
  programId: string;
  theoryHours: number;
  practicalHours: number;
  totalHours: number;
  lastSyncedAt: Date;
  miladyCourses: {
    courseId: string;
    courseName: string;
    hoursCompleted: number;
    progressPercentage: number;
    status: string;
    lastActivityDate?: Date;
  }[];
}

/**
 * Sync Milady progress for a single student
 */
export async function syncStudentMiladyProgress(
  studentId: string
): Promise<ECRRecord | null> {
  const supabase = await createClient();

  // Get active enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(
      `
      *,
      program:programs(*)
    `
    )
    .eq('student_id', studentId)
    .eq('status', 'active')
    .single();

  if (!enrollment) {
    return null;
  }

  // Get Milady provider
  const { data: miladyProvider } = await supabase
    .from('partner_lms_providers')
    .select('*')
    .eq('provider_type', 'milady')
    .single();

  if (!miladyProvider) {
    return null;
  }

  // Get Milady enrollments
  const { data: miladyEnrollments } = await supabase
    .from('partner_lms_enrollments')
    .select(
      `
      *,
      course:partner_lms_courses(*)
    `
    )
    .eq('student_id', studentId)
    .eq('provider_id', miladyProvider.id);

  if (!miladyEnrollments || miladyEnrollments.length === 0) {
    return null;
  }

  // Initialize Milady API
  const miladyAPI = new MiladyAPI({
    apiKey: process.env.MILADY_API_KEY || '',
    apiSecret: process.env.MILADY_API_SECRET || '',
    baseUrl: process.env.MILADY_API_URL || 'https://api.miladytraining.com/v1',
    orgId: process.env.MILADY_ORG_ID || '',
  });

  const miladyCourses: ECRRecord['miladyCourses'] = [];
  let totalTheoryHours = 0;

  // Sync each Milady enrollment
  for (const miladyEnrollment of miladyEnrollments) {
    try {
      // Fetch latest progress from Milady
      const progress = await miladyAPI.getProgress(
        miladyEnrollment.external_enrollment_id || miladyEnrollment.id
      );

      if (progress) {
        // Update enrollment record
        await supabase
          .from('partner_lms_enrollments')
          .update({
            progress_percentage: progress.percentage,
            hours_completed: progress.lessonsCompleted || 0,
            status: progress.completed ? 'completed' : 'in_progress',
            last_synced_at: new Date().toISOString(),
            completed_at: progress.completedAt?.toISOString(),
          })
          .eq('id', miladyEnrollment.id);

        const hoursCompleted = progress.lessonsCompleted || 0;
        totalTheoryHours += hoursCompleted;

        miladyCourses.push({
          courseId: miladyEnrollment.course_id,
          courseName:
            miladyEnrollment.course_name ||
            miladyEnrollment.course?.name ||
            'Unknown Course',
          hoursCompleted,
          progressPercentage: progress.percentage,
          status: progress.completed ? 'completed' : 'in_progress',
          lastActivityDate: progress.lastAccessed,
        });

        // If completed, fetch certificate
        if (progress.completed && !miladyEnrollment.certificate_url) {
          const certificate = await miladyAPI.getCertificate(
            miladyEnrollment.external_enrollment_id || miladyEnrollment.id
          );

          if (certificate) {
            await supabase
              .from('partner_lms_enrollments')
              .update({
                certificate_url: certificate.downloadUrl,
                certificate_number: certificate.certificateNumber,
                certificate_issued_at: certificate.issuedDate.toISOString(),
              })
              .eq('id', miladyEnrollment.id);
          }
        }
      }
    } catch (error) { /* Error handled silently */ 
      logger.error(
        `Failed to sync Milady enrollment ${miladyEnrollment.id}:`,
        error
      );
      // Continue with other enrollments
    }
  }

  // Get practical hours from internal tracking
  const { data: practicalHours } = await supabase
    .from('student_hours')
    .select('*')
    .eq('student_id', studentId)
    .eq('enrollment_id', enrollment.id)
    .eq('approved', true);

  const totalPracticalHours =
    practicalHours?.reduce((sum, h) => sum + (h.hours || 0), 0) || 0;
  const totalHours = totalTheoryHours + totalPracticalHours;

  // Update enrollment progress
  const requiredHours = enrollment.program?.total_hours || 0;
  const progressPercentage =
    requiredHours > 0 ? Math.round((totalHours / requiredHours) * 100) : 0;

  await supabase
    .from('enrollments')
    .update({
      progress_percentage: progressPercentage,
      theory_hours_completed: totalTheoryHours,
      practical_hours_completed: totalPracticalHours,
      total_hours_completed: totalHours,
      last_progress_update: new Date().toISOString(),
    })
    .eq('id', enrollment.id);

  // Create ECR record
  const ecrRecord: ECRRecord = {
    studentId,
    enrollmentId: enrollment.id,
    programId: enrollment.program_id,
    theoryHours: totalTheoryHours,
    practicalHours: totalPracticalHours,
    totalHours,
    lastSyncedAt: new Date(),
    miladyCourses,
  };

  // Store ECR snapshot for compliance reporting
  await supabase.from('ecr_snapshots').insert({
    student_id: studentId,
    enrollment_id: enrollment.id,
    theory_hours: totalTheoryHours,
    practical_hours: totalPracticalHours,
    total_hours: totalHours,
    progress_percentage: progressPercentage,
    milady_courses: miladyCourses,
    snapshot_date: new Date().toISOString(),
  });

  return ecrRecord;
}

/**
 * Sync all active students
 */
export async function syncAllStudents(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  const supabase = await createClient();

  // Get all students with active enrollments
  const { data: activeEnrollments } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('status', 'active');

  if (!activeEnrollments || activeEnrollments.length === 0) {
    return { success: 0, failed: 0, total: 0 };
  }

  const uniqueStudentIds = [
    ...new Set(activeEnrollments.map((e) => e.student_id)),
  ];
  let success = 0;
  let failed = 0;

  for (const studentId of uniqueStudentIds) {
    try {
      await syncStudentMiladyProgress(studentId);
      success++;
    } catch (error) { /* Error handled silently */ 
      // Error logged
      failed++;
    }
  }

  // Log sync job
  await supabase.from('ecr_sync_logs').insert({
    total_students: uniqueStudentIds.length,
    successful: success,
    failed,
    sync_date: new Date().toISOString(),
  });

  return {
    success,
    failed,
    total: uniqueStudentIds.length,
  };
}

/**
 * Generate ECR report for state board
 */
export async function generateECRReport(studentId: string): Promise<{
  student: {
    name: string;
    email: string;
    studentId: string;
  };
  program: {
    name: string;
    requiredHours: number;
  };
  hours: {
    theory: number;
    practical: number;
    total: number;
    percentage: number;
  };
  miladyCourses: {
    name: string;
    hours: number;
    status: string;
    completedAt?: string;
  }[];
  practicalActivities: {
    date: string;
    activity: string;
    hours: number;
    supervisor: string;
  }[];
  generatedAt: Date;
}> {
  const supabase = await createClient();

  // Get student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single();

  // Get enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(
      `
      *,
      program:programs(*)
    `
    )
    .eq('student_id', studentId)
    .eq('status', 'active')
    .single();

  if (!profile || !enrollment) {
    throw new Error('Student or enrollment not found');
  }

  // Get Milady courses
  const { data: miladyProvider } = await supabase
    .from('partner_lms_providers')
    .select('id')
    .eq('provider_type', 'milady')
    .single();

  const { data: miladyEnrollments } = miladyProvider
    ? await supabase
        .from('partner_lms_enrollments')
        .select('*')
        .eq('student_id', studentId)
        .eq('provider_id', miladyProvider.id)
    : { data: [] };

  // Get practical hours
  const { data: practicalHours } = await supabase
    .from('student_hours')
    .select(
      `
      *,
      supervisor:profiles!student_hours_supervisor_id_fkey(full_name)
    `
    )
    .eq('student_id', studentId)
    .eq('enrollment_id', enrollment.id)
    .eq('approved', true)
    .order('date', { ascending: false });

  const theoryHours =
    miladyEnrollments?.reduce((sum, e) => sum + (e.hours_completed || 0), 0) ||
    0;
  const practicalHoursTotal =
    practicalHours?.reduce((sum, h) => sum + (h.hours || 0), 0) || 0;
  const totalHours = theoryHours + practicalHoursTotal;
  const requiredHours = enrollment.program?.total_hours || 0;
  const percentage =
    requiredHours > 0 ? Math.round((totalHours / requiredHours) * 100) : 0;

  return {
    student: {
      name: profile.full_name || 'Unknown',
      email: profile.email || '',
      studentId: profile.id,
    },
    program: {
      name: enrollment.program?.name || 'Unknown Program',
      requiredHours,
    },
    hours: {
      theory: theoryHours,
      practical: practicalHoursTotal,
      total: totalHours,
      percentage,
    },
    miladyCourses:
      miladyEnrollments?.map((e) => ({
        name: e.course_name || 'Unknown Course',
        hours: e.hours_completed || 0,
        status: e.status || 'unknown',
        completedAt: e.completed_at,
      })) || [],
    practicalActivities:
      practicalHours?.map((h) => ({
        date: h.date,
        activity: h.activity_type || 'Unknown',
        hours: h.hours || 0,
        supervisor: h.supervisor?.full_name || 'Unknown',
      })) || [],
    generatedAt: new Date(),
  };
}
