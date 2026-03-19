/**
 * Single approval pipeline. Every approval in the system calls this function.
 * No other code should create enrollments or change application status.
 *
 * Steps:
 * 1. Find or create auth user + profile
 * 2. Create program_enrollments (enrollment_state: 'active')
 * 3. Create training_enrollments for all active courses in the program
 * 4. Update application status to 'approved'
 * 5. Update profile enrollment_status to 'active'
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ApproveApplicationInput {
  applicationId: string;
  programId?: string | null;
  fundingType?: string | null;
  /** Role to assign to the created/updated profile. Defaults to 'student'. */
  role?: string;
}

export interface ApproveApplicationResult {
  success: boolean;
  userId?: string;
  enrollmentId?: string | null;
  /** Password setup link for new users — null if user already existed */
  passwordSetupLink?: string | null;
  error?: string;
}

export async function approveApplication(
  db: SupabaseClient,
  input: ApproveApplicationInput,
): Promise<ApproveApplicationResult> {
  const { applicationId, programId, role: assignedRole = 'student' } = input;
  // fundingType from the caller takes precedence; fall back to what the student
  // selected on the application (verified by WorkOne where required).
  let fundingType = input.fundingType;

  // Load application
  const { data: app, error: appError } = await db
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (appError || !app) {
    return { success: false, error: 'Application not found' };
  }

  if (app.status === 'approved') {
    return { success: true, userId: app.user_id, error: 'Already approved' };
  }

  // Block approval of WorkOne-pending applications until external confirmation is on record.
  // Staff must update has_workone_approval = true (and optionally workone_approval_ref)
  // before approving. This prevents enrolling students whose WIOA eligibility is unconfirmed.
  if (app.status === 'pending_workone' && !app.has_workone_approval) {
    return {
      success: false,
      error: 'This application is pending WorkOne eligibility confirmation. Update has_workone_approval before approving.',
    };
  }

  const email = (app.email || '').trim().toLowerCase();
  if (!email) {
    return { success: false, error: 'Application has no email' };
  }

  // Step 1: Find or create user
  let userId: string | null = null;
  let isNewUser = false;

  // Check profiles first (fast, indexed)
  const { data: existingProfile } = await db
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    // Check auth users
    const { data: listUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 100 });
    const existingUser = listUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email,
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new auth user with a random temp password
      const tempPassword = `EFH-${Math.random().toString(36).slice(2, 10)}-Temp!`;
      const { data: newUser, error: createError } = await db.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
          role: 'student',
        },
      });

      if (createError || !newUser?.user) {
        logger.error('[approve] Failed to create user', { email, error: createError });
        return { success: false, error: 'Failed to create user account' };
      }
      userId = newUser.user.id;
      isNewUser = true;
    }

    // Ensure profile exists for newly created user
    await db.from('profiles').upsert({
      id: userId,
      email,
      first_name: app.first_name,
      last_name: app.last_name,
      full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
      phone: app.phone,
      role: assignedRole,
    }, { onConflict: 'id' });
  }

  // Profile already existed — update role if a non-default role was assigned
  if (existingProfile && assignedRole !== 'student') {
    await db.from('profiles').update({ role: assignedRole }).eq('id', userId);
  }

  // Resolve funding source: caller override → application's requested source → 'pending'
  if (!fundingType) {
    fundingType = app.requested_funding_source || 'pending';
  }

  // Step 2: Create program_enrollments (students only)
  const resolvedProgramId = programId || app.program_id || null;
  let enrollmentId: string | null = null;

  if (assignedRole === 'student' && resolvedProgramId) {
    const { data: pe } = await db
      .from('program_enrollments')
      .upsert({
        user_id: userId,
        program_id: resolvedProgramId,
        email,
        full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
        amount_paid_cents: 0,
        funding_source: fundingType || 'pending',
        status: 'active',
        enrollment_state: 'active',
      }, { onConflict: 'user_id,program_id', ignoreDuplicates: false })
      .select('id')
      .maybeSingle();

    enrollmentId = pe?.id || null;

    // Step 3: Create training_enrollments for all active courses
    const { data: courses } = await db
      .from('training_courses')
      .select('id')
      .eq('program_id', resolvedProgramId)
      .eq('is_active', true);

    if (courses && courses.length > 0) {
      await db.from('training_enrollments').upsert(
        courses.map((c: { id: string }) => ({
          user_id: userId,
          course_id: c.id,
          status: 'active',
          progress: 0,
          enrolled_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,course_id', ignoreDuplicates: true },
      );
    }
  }

  // Step 4: Update application status
  await db
    .from('applications')
    .update({
      status: 'approved',
      user_id: userId,
      program_id: resolvedProgramId,
      eligibility_status: 'verified',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  // Step 5: Update profile enrollment_status (students only)
  if (assignedRole === 'student') {
    await db
      .from('profiles')
      .update({ enrollment_status: 'active' })
      .eq('id', userId);
  }

  // ── Partner routing ──────────────────────────────────────────────────────
  // CNA → CMI (Choice Medical Institute, School Code #015188)
  // partner_enrollments schema: partner_id (FK→partners), student_id (FK→profiles), program_id
  const CMI_PARTNER_ID = '66685a9d-1b27-4c28-a7d7-2ee6287923bc';

  if (app.program_slug === 'cna' && userId) {
    const { data: existingCmi } = await db
      .from('cmi_students')
      .select('id')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (!existingCmi) {
      await db.from('partner_enrollments').insert({
        partner_id: CMI_PARTNER_ID,
        student_id: userId,
        program_id: resolvedProgramId ?? null,
        status: 'assigned',
        enrollment_date: new Date().toISOString(),
      });

      const { error: cmiErr } = await db.from('cmi_students').insert({
        user_id: userId,
        application_id: applicationId,
        status: 'enrolled',
      });

      if (cmiErr) {
        logger.error('[approve] Failed to create cmi_students row', { applicationId, error: cmiErr });
      } else {
        logger.info('[approve] CNA → CMI enrolled', { applicationId, userId });
      }
    }
  }

  // NHA certification lane (ekg, phlebotomy)
  if ((app.program_slug === 'ekg' || app.program_slug === 'phlebotomy') && userId) {
    await db.from('partner_enrollments').insert({
      student_id: userId,
      program_id: resolvedProgramId ?? null,
      status: 'enrolled',
      enrollment_date: new Date().toISOString(),
    });
  }

  // Generate password setup link for new users
  let passwordSetupLink: string | null = null;
  if (isNewUser && userId) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
      const { data: linkData } = await db.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${siteUrl}/auth/confirm?next=/auth/reset-password`,
        },
      });
      passwordSetupLink = linkData?.properties?.action_link || null;
    } catch (linkErr) {
      logger.warn('[approve] Failed to generate password setup link (non-fatal)', { email, error: linkErr });
    }
  }

  logger.info('[approve] Application approved', {
    applicationId,
    userId,
    programId: resolvedProgramId,
    enrollmentId,
    isNewUser,
    hasPasswordLink: !!passwordSetupLink,
  });

  return { success: true, userId: userId!, enrollmentId, passwordSetupLink };
}
