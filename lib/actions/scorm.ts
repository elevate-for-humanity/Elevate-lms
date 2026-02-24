'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function trackScormProgress(data: {
  scormPackageId: string;
  enrollmentId?: string;
  userId: string;
  status: string;
  progress: number;
  score?: number;
  timeSpent: number;
  cmiData: any;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== data.userId) {
    throw new Error('Unauthorized');
  }

  // Update SCORM enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('scorm_enrollments')
    .upsert({
      scorm_package_id: data.scormPackageId,
      user_id: data.userId,
      enrollment_id: data.enrollmentId,
      status: data.status,
      progress_percentage: data.progress,
      score: data.score,
      time_spent_seconds: data.timeSpent,
      last_accessed_at: new Date().toISOString(),
      cmi_data: data.cmiData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'scorm_package_id,user_id'
    })
    .select()
    .single();

  if (enrollmentError) {
    // Error: $1
    throw new Error('Failed to update enrollment');
  }

  // Track individual SCORM elements
  if (data.cmiData) {
    const trackingPromises = Object.entries(data.cmiData).map(([element, value]: any) =>
      supabase.from('scorm_tracking').insert({
        scorm_enrollment_id: enrollment.id,
        element,
        value: String(value),
      })
    );

    await Promise.all(trackingPromises);
  }

  // If completed, update main enrollment if linked
  if (data.status === 'completed' || data.status === 'passed') {
    if (data.enrollmentId) {
      await supabase
        .from('program_enrollments')
        .update({
          progress: 100,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', data.enrollmentId);
    }
  }

  revalidatePath('/lms/courses');
  return { success: true, enrollment };
}

export async function getScormEnrollment(scormPackageId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: enrollment, error } = await supabase
    .from('scorm_enrollments')
    .select('*')
    .eq('scorm_package_id', scormPackageId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Error: $1
    throw new Error('Failed to fetch enrollment');
  }

  return enrollment || null;
}

export async function enrollInPartnerCourse(data: {
  partnerCourseId: string;
  programId?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get partner course details
  const { data: partnerCourse, error: courseError } = await supabase
    .from('partner_lms_courses')
    .select(`
      *,
      provider:partner_lms_providers(*)
    `)
    .eq('id', data.partnerCourseId)
    .single();

  if (courseError || !partnerCourse) {
    throw new Error('Partner course not found');
  }

  // Check if already enrolled
  const { data: existingEnrollment } = await supabase
    .from('partner_lms_enrollments')
    .select('*')
    .eq('student_id', user.id)
    .eq('course_id', data.partnerCourseId)
    .single();

  if (existingEnrollment) {
    return {
      error: 'Already enrolled in this course',
      enrollment: existingEnrollment
    };
  }

  // Create external enrollment ID
  const externalEnrollmentId = `ext_${Date.now()}_${user.id.slice(0, 8)}`;
  const externalAccountId = user.email;

  // Create partner enrollment record
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('partner_lms_enrollments')
    .insert({
      provider_id: partnerCourse.provider_id,
      student_id: user.id,
      course_id: data.partnerCourseId,
      program_id: data.programId,
      status: 'pending',
      external_enrollment_id: externalEnrollmentId,
      external_account_id: externalAccountId,
      enrolled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (enrollmentError) {
    // Error: $1
    throw new Error('Failed to create enrollment');
  }

  // Check if there's a SCORM package mapped to this course
  const { data: mapping } = await supabase
    .from('partner_course_mappings')
    .select(`
      *,
      scorm_package:scorm_packages(*)
    `)
    .eq('partner_course_id', data.partnerCourseId)
    .eq('is_active', true)
    .single();

  // If SCORM package exists, create SCORM enrollment
  if (mapping?.scorm_package) {
    await supabase
      .from('scorm_enrollments')
      .insert({
        scorm_package_id: mapping.scorm_package_id,
        user_id: user.id,
        enrollment_id: enrollment.id,
        status: 'not_attempted',
      });
  }

  // Log the sync
  await supabase
    .from('lms_sync_log')
    .insert({
      provider_id: partnerCourse.provider_id,
      sync_type: 'enrollment',
      status: 'success',
      records_processed: 1,
      sync_data: {
        enrollment_id: enrollment.id,
        course_id: data.partnerCourseId,
        user_id: user.id,
      },
      completed_at: new Date().toISOString(),
    });

  revalidatePath('/courses/partners');
  revalidatePath('/lms/courses');

  return {
    success: true,
    enrollment,
    hasScorm: !!mapping?.scorm_package,
    scormPackage: mapping?.scorm_package,
  };
}

export async function getPartnerEnrollments(userId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const targetUserId = userId || user.id;

  // Get all partner enrollments for user
  const { data: enrollments, error } = await supabase
    .from('partner_lms_enrollments')
    .select(`
      *,
      course:partner_courses(*),
      provider:partner_lms_providers(*),
      program:programs(name, slug)
    `)
    .eq('student_id', targetUserId)
    .order('enrolled_at', { ascending: false });

  if (error) {
    // Error: $1
    throw new Error('Failed to fetch enrollments');
  }

  return enrollments;
}

export async function syncPartnerProgress(enrollmentId: string, progressData: {
  progress: number;
  status: string;
  completedModules?: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Update partner enrollment
  const { error } = await supabase
    .from('partner_lms_enrollments')
    .update({
      progress_percentage: progressData.progress,
      status: progressData.status,
      completed_at: progressData.status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId)
    .eq('student_id', user.id);

  if (error) {
    // Error: $1
    throw new Error('Failed to update progress');
  }

  revalidatePath('/lms/courses');
  return { success: true };
}
