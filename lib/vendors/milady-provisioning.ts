import { logger } from '@/lib/logger';
/**
 * Milady Access Provisioning
 * 
 * Handles provisioning Milady RISE access for students.
 * Supports multiple provisioning methods:
 * 
 * 1. API Integration - Direct API calls to create accounts (requires Milady API access)
 * 2. License Codes - Assign pre-purchased license codes to students
 * 3. School Portal - Manual provisioning via Milady school admin portal
 * 4. SSO Link - Generate SSO links for pre-authorized students
 */

import { createClient } from '@/lib/supabase/server';

// Milady course codes by program
const MILADY_COURSE_CODES: Record<string, string> = {
  'barber-apprenticeship': 'BARBER-RTI-2024',
  'cosmetology-apprenticeship': 'COSMO-RTI-2024',
  'esthetician-apprenticeship': 'ESTH-RTI-2024',
  'nail-technician-apprenticeship': 'NAIL-RTI-2024',
};

// Milady bundle URLs (for link-based access)
const MILADY_BUNDLE_URLS: Record<string, string> = {
  'barber-apprenticeship': 'https://www.miladytraining.com/bundles/barber-apprentice-program',
  'cosmetology-apprenticeship': 'https://www.miladytraining.com/bundles/cosmetology-apprentice-program',
  'esthetician-apprenticeship': 'https://www.miladytraining.com/bundles/esthetics-apprentice-program',
  'nail-technician-apprenticeship': 'https://www.miladytraining.com/bundles/nail-tech-apprentice-program',
};

export interface MiladyProvisioningResult {
  success: boolean;
  method: 'api' | 'license_code' | 'manual' | 'link';
  accessUrl?: string;
  licenseCode?: string;
  username?: string;
  temporaryPassword?: string;
  error?: string;
  requiresManualSetup?: boolean;
}

export interface StudentInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/**
 * Provision Milady access for a student
 * Tries API first, falls back to license code, then manual
 */
export async function provisionMiladyAccess(
  student: StudentInfo,
  programSlug: string
): Promise<MiladyProvisioningResult> {
  const supabase = await createClient();

  // Method 1: Try API provisioning if configured
  if (process.env.MILADY_API_KEY && process.env.MILADY_SCHOOL_ID) {
    try {
      const apiResult = await provisionViaAPI(student, programSlug);
      if (apiResult.success) {
        await recordProvisioning(supabase, student.id, programSlug, apiResult);
        return apiResult;
      }
    } catch (error) {
      logger.warn('[Milady] API provisioning failed, trying license code');
    }
  }

  // Method 2: Try license code assignment
  const licenseResult = await assignLicenseCode(supabase, student, programSlug);
  if (licenseResult.success) {
    await recordProvisioning(supabase, student.id, programSlug, licenseResult);
    return licenseResult;
  }

  // Method 3: Queue for manual provisioning
  const manualResult = await queueManualProvisioning(supabase, student, programSlug);
  return manualResult;
}

/**
 * Provision via Milady API (if available)
 */
async function provisionViaAPI(
  student: StudentInfo,
  programSlug: string
): Promise<MiladyProvisioningResult> {
  const { createAccount, enrollInCourse } = await import('@/lib/partners/milady');

  // Create Milady account
  const account = await createAccount({
    id: student.id,
    email: student.email,
    firstName: student.firstName,
    lastName: student.lastName,
    phone: student.phone || '',
  });

  // Enroll in course
  const courseCode = MILADY_COURSE_CODES[programSlug];
  if (courseCode && account.externalId) {
    await enrollInCourse(account.externalId, courseCode);
  }

  return {
    success: true,
    method: 'api',
    accessUrl: account.loginUrl || 'https://www.miladytraining.com/users/sign_in',
    username: account.username,
  };
}

/**
 * Assign a pre-purchased license code to student
 */
async function assignLicenseCode(
  supabase: any,
  student: StudentInfo,
  programSlug: string
): Promise<MiladyProvisioningResult> {
  // Check for available license codes
  const { data: availableCode, error } = await supabase
    .from('milady_license_codes')
    .select('*')
    .eq('program_slug', programSlug)
    .eq('status', 'available')
    .limit(1)
    .single();

  if (error || !availableCode) {
    return {
      success: false,
      method: 'license_code',
      error: 'No available license codes',
    };
  }

  // Assign code to student
  const { error: updateError } = await supabase
    .from('milady_license_codes')
    .update({
      status: 'assigned',
      assigned_to: student.id,
      assigned_at: new Date().toISOString(),
    })
    .eq('id', availableCode.id);

  if (updateError) {
    return {
      success: false,
      method: 'license_code',
      error: 'Failed to assign license code',
    };
  }

  return {
    success: true,
    method: 'license_code',
    licenseCode: availableCode.code,
    accessUrl: `${MILADY_BUNDLE_URLS[programSlug]}?code=${availableCode.code}`,
  };
}

/**
 * Queue student for manual provisioning via Milady school portal
 */
async function queueManualProvisioning(
  supabase: any,
  student: StudentInfo,
  programSlug: string
): Promise<MiladyProvisioningResult> {
  // Create manual provisioning request
  const { error } = await supabase
    .from('milady_provisioning_queue')
    .insert({
      student_id: student.id,
      student_email: student.email,
      student_name: `${student.firstName} ${student.lastName}`,
      program_slug: programSlug,
      course_code: MILADY_COURSE_CODES[programSlug],
      status: 'pending',
      created_at: new Date().toISOString(),
    });

  if (error) {
    logger.error('[Milady] Failed to queue manual provisioning:', error);
  }

  // Return link-based access as fallback
  return {
    success: true,
    method: 'link',
    accessUrl: MILADY_BUNDLE_URLS[programSlug],
    requiresManualSetup: true,
  };
}

/**
 * Record provisioning in database
 */
async function recordProvisioning(
  supabase: any,
  studentId: string,
  programSlug: string,
  result: MiladyProvisioningResult
) {
  await supabase.from('milady_access').upsert({
    student_id: studentId,
    program_slug: programSlug,
    provisioning_method: result.method,
    access_url: result.accessUrl,
    license_code: result.licenseCode,
    username: result.username,
    status: result.requiresManualSetup ? 'pending_setup' : 'active',
    provisioned_at: new Date().toISOString(),
  }, {
    onConflict: 'student_id,program_slug',
  });
}

/**
 * Get student's Milady access info
 */
export async function getMiladyAccess(
  studentId: string,
  programSlug: string
): Promise<MiladyProvisioningResult | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('milady_access')
    .select('*')
    .eq('student_id', studentId)
    .eq('program_slug', programSlug)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    success: true,
    method: data.provisioning_method,
    accessUrl: data.access_url,
    licenseCode: data.license_code,
    username: data.username,
    requiresManualSetup: data.status === 'pending_setup',
  };
}

/**
 * Mark student's Milady access as manually provisioned
 * Called by admin after setting up access in Milady school portal
 */
export async function markManuallyProvisioned(
  studentId: string,
  programSlug: string,
  credentials: { username?: string; accessUrl?: string }
) {
  const supabase = await createClient();

  await supabase
    .from('milady_access')
    .update({
      status: 'active',
      username: credentials.username,
      access_url: credentials.accessUrl || 'https://www.miladytraining.com/users/sign_in',
      manually_provisioned_at: new Date().toISOString(),
    })
    .eq('student_id', studentId)
    .eq('program_slug', programSlug);

  // Remove from queue
  await supabase
    .from('milady_provisioning_queue')
    .update({ status: 'completed' })
    .eq('student_id', studentId)
    .eq('program_slug', programSlug);

  return { success: true };
}
