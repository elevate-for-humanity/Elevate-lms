/**
 * Unified Enrollment Service
 * 
 * This service provides a single interface for enrollment operations,
 * abstracting the underlying table structure.
 * 
 * Table Usage:
 * - `enrollments`: Course-level access (user_id + course_id)
 * - `student_enrollments`: Program-level with case management
 * - `program_enrollments`: Workforce-funded with program holders
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type EnrollmentType = 'course' | 'program' | 'workforce';

export interface UnifiedEnrollmentParams {
  userId: string;
  // One of these is required
  courseId?: string;
  programId?: string;
  programSlug?: string;
  // Enrollment details
  fundingSource?: string;
  programHolderId?: string;
  caseId?: string;
  stripeSessionId?: string;
  // Metadata
  enrollmentMethod?: string;
}

export interface UnifiedEnrollmentResult {
  success: boolean;
  enrollmentId?: string;
  enrollmentType?: EnrollmentType;
  error?: string;
  table?: string;
}

/**
 * Determine which enrollment type/table to use based on context
 */
function determineEnrollmentType(params: UnifiedEnrollmentParams): EnrollmentType {
  // If course-only enrollment
  if (params.courseId && !params.programId && !params.programSlug) {
    return 'course';
  }
  
  // If workforce-funded with program holder
  if (params.programHolderId || params.fundingSource?.match(/WIOA|WRG|JRI|workforce/i)) {
    return 'workforce';
  }
  
  // Default to program enrollment for multi-module programs
  return 'program';
}

/**
 * Create enrollment in the appropriate table
 */
export async function createUnifiedEnrollment(
  params: UnifiedEnrollmentParams
): Promise<UnifiedEnrollmentResult> {
  const supabase = await createClient();
  const enrollmentType = determineEnrollmentType(params);

  try {
    switch (enrollmentType) {
      case 'course':
        return await createCourseEnrollment(supabase, params);
      case 'program':
        return await createProgramEnrollment(supabase, params);
      case 'workforce':
        return await createWorkforceEnrollment(supabase, params);
      default:
        return { success: false, error: 'Unknown enrollment type' };
    }
  } catch (error: any) {
    logger.error('Unified enrollment error:', error);
    return { success: false, error: 'Operation failed' };
  }
}

/**
 * Course-level enrollment (enrollments table)
 */
async function createCourseEnrollment(
  supabase: any,
  params: UnifiedEnrollmentParams
): Promise<UnifiedEnrollmentResult> {
  if (!params.courseId) {
    return { success: false, error: 'courseId required for course enrollment' };
  }

  // Check existing
  const { data: existing } = await supabase
    .from('program_enrollments')
    .select('user_id')
    .eq('user_id', params.userId)
    .eq('course_id', params.courseId)
    .single();

  if (existing) {
    return { 
      success: false, 
      error: 'Already enrolled in this course',
      enrollmentType: 'course',
      table: 'enrollments'
    };
  }

  const { data, error } = await supabase
    .from('program_enrollments')
    .insert({
      user_id: params.userId,
      course_id: params.courseId,
      status: 'active',
      progress_percent: 0,
      started_at: new Date().toISOString(),
      enrollment_method: params.enrollmentMethod || 'direct',
      funding_source: params.fundingSource,
      payment_id: params.stripeSessionId,
    })
    .select('user_id, course_id')
    .single();

  if (error) {
    return { success: false, error: 'Operation failed', table: 'enrollments' };
  }

  return {
    success: true,
    enrollmentId: `${data.user_id}_${data.course_id}`,
    enrollmentType: 'course',
    table: 'enrollments',
  };
}

/**
 * Program-level enrollment (student_enrollments table)
 */
async function createProgramEnrollment(
  supabase: any,
  params: UnifiedEnrollmentParams
): Promise<UnifiedEnrollmentResult> {
  const programId = params.programId || params.programSlug;
  
  if (!programId) {
    return { success: false, error: 'programId or programSlug required' };
  }

  // Check existing active enrollment
  const { data: existing } = await supabase
    .from('student_enrollments')
    .select('id')
    .eq('student_id', params.userId)
    .eq('program_slug', programId)
    .eq('status', 'active')
    .single();

  if (existing) {
    return {
      success: false,
      error: 'Already enrolled in this program',
      enrollmentId: existing.id,
      enrollmentType: 'program',
      table: 'student_enrollments',
    };
  }

  const { data, error } = await supabase
    .from('student_enrollments')
    .insert({
      student_id: params.userId,
      program_slug: programId,
      program_id: params.programId,
      status: 'active',
      funding_source: params.fundingSource,
      case_id: params.caseId,
      stripe_checkout_session_id: params.stripeSessionId,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: 'Operation failed', table: 'student_enrollments' };
  }

  return {
    success: true,
    enrollmentId: data.id,
    enrollmentType: 'program',
    table: 'student_enrollments',
  };
}

/**
 * Workforce-funded enrollment (program_enrollments table)
 */
async function createWorkforceEnrollment(
  supabase: any,
  params: UnifiedEnrollmentParams
): Promise<UnifiedEnrollmentResult> {
  const programId = params.programId || params.programSlug;
  
  if (!programId) {
    return { success: false, error: 'programId required for workforce enrollment' };
  }

  // Check existing
  const { data: existing } = await supabase
    .from('program_enrollments')
    .select('id, status')
    .eq('student_id', params.userId)
    .eq('program_id', programId)
    .in('status', ['IN_PROGRESS', 'active'])
    .single();

  if (existing) {
    return {
      success: false,
      error: 'Already enrolled in this program',
      enrollmentId: existing.id,
      enrollmentType: 'workforce',
      table: 'program_enrollments',
    };
  }

  const { data, error } = await supabase
    .from('program_enrollments')
    .insert({
      student_id: params.userId,
      program_id: programId,
      program_holder_id: params.programHolderId,
      funding_source: params.fundingSource || 'WIOA',
      status: 'IN_PROGRESS',
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: 'Operation failed', table: 'program_enrollments' };
  }

  return {
    success: true,
    enrollmentId: data.id,
    enrollmentType: 'workforce',
    table: 'program_enrollments',
  };
}

/**
 * Get all enrollments for a user across all tables
 */
export async function getUserEnrollments(userId: string) {
  const supabase = await createClient();

  const [courseEnrollments, programEnrollments, workforceEnrollments] = await Promise.all([
    // Course enrollments
    supabase
      .from('program_enrollments')
      .select('*, courses(id, title, slug)')
      .eq('user_id', userId),
    
    // Program enrollments (student_enrollments)
    supabase
      .from('student_enrollments')
      .select('*, programs(id, name, slug)')
      .eq('student_id', userId),
    
    // Workforce enrollments (program_enrollments)
    supabase
      .from('program_enrollments')
      .select('*, programs(id, name, slug), program_holders(id, name)')
      .eq('student_id', userId),
  ]);

  return {
    courses: courseEnrollments.data || [],
    programs: programEnrollments.data || [],
    workforce: workforceEnrollments.data || [],
    all: [
      ...(courseEnrollments.data || []).map(e => ({ ...e, _type: 'course' })),
      ...(programEnrollments.data || []).map(e => ({ ...e, _type: 'program' })),
      ...(workforceEnrollments.data || []).map(e => ({ ...e, _type: 'workforce' })),
    ],
  };
}

/**
 * Check if user is enrolled in a course or program
 */
export async function checkEnrollmentStatus(
  userId: string,
  options: { courseId?: string; programId?: string; programSlug?: string }
): Promise<{ enrolled: boolean; enrollmentType?: EnrollmentType; status?: string }> {
  const supabase = await createClient();

  if (options.courseId) {
    const { data } = await supabase
      .from('program_enrollments')
      .select('status')
      .eq('user_id', userId)
      .eq('course_id', options.courseId)
      .single();
    
    if (data) {
      return { enrolled: true, enrollmentType: 'course', status: data.status };
    }
  }

  if (options.programId || options.programSlug) {
    // Check student_enrollments
    const { data: studentEnroll } = await supabase
      .from('student_enrollments')
      .select('status')
      .eq('student_id', userId)
      .or(`program_id.eq.${options.programId},program_slug.eq.${options.programSlug}`)
      .eq('status', 'active')
      .single();

    if (studentEnroll) {
      return { enrolled: true, enrollmentType: 'program', status: studentEnroll.status };
    }

    // Check program_enrollments
    const { data: workforceEnroll } = await supabase
      .from('program_enrollments')
      .select('status')
      .eq('student_id', userId)
      .eq('program_id', options.programId || options.programSlug)
      .in('status', ['IN_PROGRESS', 'active'])
      .single();

    if (workforceEnroll) {
      return { enrolled: true, enrollmentType: 'workforce', status: workforceEnroll.status };
    }
  }

  return { enrolled: false };
}
