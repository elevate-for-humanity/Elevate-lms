/**
 * Apprenticeship Access Control
 * 
 * Enforces the enrollment state model:
 * - applied: No access to anything
 * - enrolled_pending_approval: Payment received, waiting for approval
 * - active: Full access to portal, hours, LMS
 * - paused: Access suspended (payment failed, compliance issue)
 * 
 * CRITICAL: Stripe payment does NOT grant training access.
 * Only admin approval moves status to 'active'.
 */

import { createClient } from '@/lib/supabase/server';

export type EnrollmentStatus = 
  | 'applied' 
  | 'enrolled_pending_approval' 
  | 'active' 
  | 'paused' 
  | 'withdrawn' 
  | 'completed';

export interface EnrollmentAccess {
  canAccessPortal: boolean;
  canTrackHours: boolean;
  canAccessLms: boolean;
  canViewProgress: boolean;
  canMessageAdvisor: boolean;
  canUploadDocuments: boolean;
  status: EnrollmentStatus | null;
  message: string;
}

/**
 * Check what a user can access based on their enrollment status
 */
export async function checkEnrollmentAccess(
  userId: string,
  programSlug?: string
): Promise<EnrollmentAccess> {
  const supabase = await createClient();

  // Get enrollment for this user (optionally filtered by program)
  let query = supabase
    .from('program_enrollments')
    .select('id, status, program_slug, agreement_signed')
    .eq('user_id', userId);

  if (programSlug) {
    query = query.eq('program_slug', programSlug);
  }

  const { data: enrollment, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !enrollment) {
    return {
      canAccessPortal: false,
      canTrackHours: false,
      canAccessLms: false,
      canViewProgress: false,
      canMessageAdvisor: false,
      canUploadDocuments: false,
      status: null,
      message: 'No enrollment found. Please apply first.',
    };
  }

  const status = enrollment.status as EnrollmentStatus;

  // Define access based on status
  switch (status) {
    case 'applied':
      return {
        canAccessPortal: false,
        canTrackHours: false,
        canAccessLms: false,
        canViewProgress: false,
        canMessageAdvisor: true,
        canUploadDocuments: true,
        status,
        message: 'Application submitted. Complete payment to continue enrollment.',
      };

    case 'enrolled_pending_approval':
      return {
        canAccessPortal: false,
        canTrackHours: false,
        canAccessLms: false,
        canViewProgress: true, // Can see their status
        canMessageAdvisor: true,
        canUploadDocuments: true,
        status,
        message: 'Payment received. Waiting for shop assignment and approval. Training access unlocks after approval.',
      };

    case 'active':
      // Full access — LMS requires signed agreement
      return {
        canAccessPortal: true,
        canTrackHours: true,
        canAccessLms: enrollment.agreement_signed === true,
        canViewProgress: true,
        canMessageAdvisor: true,
        canUploadDocuments: true,
        status,
        message: enrollment.agreement_signed 
          ? 'Full access granted.' 
          : 'Sign the enrollment agreement to access training materials.',
      };

    case 'paused':
      return {
        canAccessPortal: false,
        canTrackHours: false,
        canAccessLms: false,
        canViewProgress: true,
        canMessageAdvisor: true,
        canUploadDocuments: false,
        status,
        message: 'Enrollment paused. Please contact support to resolve.',
      };

    case 'withdrawn':
    case 'completed':
      return {
        canAccessPortal: false,
        canTrackHours: false,
        canAccessLms: false,
        canViewProgress: true, // Can view historical progress
        canMessageAdvisor: false,
        canUploadDocuments: false,
        status,
        message: status === 'completed' 
          ? 'Program completed. Congratulations!' 
          : 'Enrollment withdrawn.',
      };

    default:
      return {
        canAccessPortal: false,
        canTrackHours: false,
        canAccessLms: false,
        canViewProgress: false,
        canMessageAdvisor: false,
        canUploadDocuments: false,
        status: null,
        message: 'Unknown enrollment status.',
      };
  }
}

/**
 * Require active enrollment - throws if not active
 */
export async function requireActiveEnrollment(
  userId: string,
  programSlug?: string
): Promise<void> {
  const access = await checkEnrollmentAccess(userId, programSlug);
  
  if (access.status !== 'active') {
    throw new Error(access.message);
  }
}

/**
 * Require portal access - throws if not allowed
 */
export async function requirePortalAccess(
  userId: string,
  programSlug?: string
): Promise<void> {
  const access = await checkEnrollmentAccess(userId, programSlug);
  
  if (!access.canAccessPortal) {
    throw new Error(access.message);
  }
}

/**
 * Require hours tracking access - throws if not allowed
 */
export async function requireHoursAccess(
  userId: string,
  programSlug?: string
): Promise<void> {
  const access = await checkEnrollmentAccess(userId, programSlug);
  
  if (!access.canTrackHours) {
    throw new Error(access.message);
  }
}

/**
 * Require LMS access — throws if not allowed
 */
export async function requireLmsAccess(
  userId: string,
  programSlug?: string
): Promise<void> {
  const access = await checkEnrollmentAccess(userId, programSlug);
  
  if (!access.canAccessLms) {
    throw new Error(access.message);
  }
}

/**
 * Check if user has submitted an application (required before payment)
 */
export async function hasSubmittedApplication(
  userId: string,
  programSlug: string
): Promise<{ hasApplication: boolean; applicationId: string | null }> {
  const supabase = await createClient();

  const { data: application } = await supabase
    .from('applications')
    .select('id, status')
    .eq('user_id', userId)
    .eq('program_slug', programSlug)
    .in('status', ['submitted', 'approved', 'payment_received'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    hasApplication: !!application,
    applicationId: application?.id || null,
  };
}

/**
 * Approve an enrollment (admin only)
 * Moves status from enrolled_pending_approval → active
 */
export async function approveEnrollment(
  enrollmentId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: enrollment, error: fetchError } = await supabase
    .from('program_enrollments')
    .select('id, status, user_id, program_slug')
    .eq('id', enrollmentId)
    .single();

  if (fetchError || !enrollment) {
    return { success: false, error: 'Enrollment not found' };
  }

  if (enrollment.status !== 'enrolled_pending_approval') {
    return { 
      success: false, 
      error: `Cannot approve enrollment with status: ${enrollment.status}` 
    };
  }

  const { error: updateError } = await supabase
    .from('program_enrollments')
    .update({
      status: 'active',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .eq('id', enrollmentId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
