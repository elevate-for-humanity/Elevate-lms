/**
 * Single approval pipeline. Every approval in the system calls this function.
 * No other code should create enrollments or change application status.
 *
 * Steps:
 * 1. Find or create auth user + profile
 * 2. Create canonical program_enrollments (enrollment_state: 'active')
 * 3. Verify the database enrollment trigger provisioned all active LMS courses
 * 4. Update application status to 'approved'
 * 5. Update profile enrollment_status to 'active'
 */

import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import { attachPartnerRouting } from '@/lib/enrollment/partner-routing';
import { cachePortalTypeForEnrollment } from '@/lib/portal/router';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ensureDigitalBinder } from '@/lib/enrollment/ensure-digital-binder';

export interface ApproveApplicationInput {
  applicationId: string;
  programId?: string | null;
  fundingType?: string | null;
  role?: string;
  bypassPaymentGate?: boolean;
}

export interface ApproveApplicationResult {
  success: boolean;
  userId?: string;
  enrollmentId?: string | null;
  passwordSetupLink?: string | null;
  tempPassword?: string | null;
  error?: string;
}

const APPROVABLE_APPLICATION_STATUSES = new Set([
  'under_review',
  'funding_review',
  'pending_workone',
  'in_review',
  'ready_to_enroll',
  'enrolled',
]);

export async function approveApplication(
  db: SupabaseClient,
  input: ApproveApplicationInput,
): Promise<ApproveApplicationResult> {
  const { applicationId, programId, role: assignedRole = 'student' } = input;
  let fundingType = input.fundingType;

  const { data: app, error: appError } = await db
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (appError || !app) return { success: false, error: 'Application not found' };
  if (app.status === 'approved') {
    return { success: true, userId: app.user_id, error: 'Already approved' };
  }

  if (!APPROVABLE_APPLICATION_STATUSES.has(app.status)) {
    return {
      success: false,
      error: `Application must be under review before approval (current status: ${app.status})`,
    };
  }

  if (app.status === 'pending_workone' && !app.has_workone_approval) {
    return {
      success: false,
      error:
        'This application is pending WorkOne eligibility confirmation. Update has_workone_approval before approving.',
    };
  }

  const isRepair = (input as any).source === 'stripe_repair';
  const NON_SELF_PAY = [
    'wioa',
    'wrg',
    'employer',
    'unsure',
    'workforce',
    'grant',
    'scholarship',
    'dol',
    'apprenticeship',
  ];
  const appFundingType = (app.funding_type || app.funding_source || '').toLowerCase();
  const isFundedPath = NON_SELF_PAY.some((f) => appFundingType.includes(f));
  const skipGate = isRepair || input.bypassPaymentGate === true || isFundedPath;

  if (!skipGate) {
    const hasFundingVerified = app.funding_verified === true || app.has_workone_approval === true;
    if (!hasFundingVerified) {
      const { data: stripeSession } = await db
        .from('stripe_sessions_staging')
        .select('session_id')
        .eq('application_id', applicationId)
        .eq('payment_status', 'paid')
        .limit(1)
        .maybeSingle();
      if (!stripeSession) {
        return {
          success: false,
          error:
            'PAYMENT_NOT_VERIFIED: No paid Stripe session and no verified funding on file. Enrollment requires payment or approved funding before access is granted.',
        };
      }
    }
  }

  const email = (app.email || '').trim().toLowerCase();
  if (!email) return { success: false, error: 'Application has no email' };

  let userId: string | null = null;
  let isNewUser = false;
  let tempPassword: string | null = null;
  let passwordSetupLink: string | null = null;

  const { data: existingProfile } = await db
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    const { data: listUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 100 });
    const existingUser = listUsers?.users?.find(
      (u: { email?: string; id: string }) => u.email?.toLowerCase() === email,
    );
    if (existingUser) {
      userId = existingUser.id;
    } else {
      tempPassword = `EFH-${randomBytes(8).toString('hex')}-Temp!`;
      const { data: newUser, error: createError } = await db.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
          role: 'student',
          must_change_password: true,
        },
      });
      if (createError || !newUser?.user) {
        logger.error('[approve] Failed to create user', createError ?? undefined, { email });
        return { success: false, error: 'Failed to create user account' };
      }
      userId = newUser.user.id;
      isNewUser = true;
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl).trim();
      const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${siteUrl}/auth/callback?redirect=/onboarding/learner` },
      });
      if (!linkError && linkData?.properties?.action_link) {
        passwordSetupLink = linkData.properties.action_link;
      } else {
        logger.warn(
          '[approve] generateLink failed — student will use forgot-password flow',
          linkError ?? undefined,
        );
      }
    }

    const { error: profileUpsertError } = await db.from('profiles').upsert(
      {
        id: userId,
        email,
        first_name: app.first_name,
        last_name: app.last_name,
        full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
        phone: app.phone,
        role: assignedRole,
      },
      { onConflict: 'id' },
    );
    if (profileUpsertError) {
      logger.error('[approve] profile upsert failed', new Error(profileUpsertError.message), {
        userId,
        applicationId,
      });
      return { success: false, error: 'Failed to provision learner profile' };
    }
  }

  if (existingProfile && assignedRole !== 'student') {
    const { error: roleUpdateError } = await db
      .from('profiles')
      .update({ role: assignedRole })
      .eq('id', userId);
    if (roleUpdateError) {
      logger.error('[approve] profile role update failed', new Error(roleUpdateError.message), {
        userId,
        assignedRole,
      });
      return { success: false, error: 'Failed to assign learner role' };
    }
  }

  if (!fundingType) fundingType = app.requested_funding_source || 'pending';

  const resolvedProgramId = programId || app.program_id || null;
  let enrollmentId: string | null = null;

  if (assignedRole === 'student') {
    if (!resolvedProgramId) {
      return { success: false, error: 'Student approval requires a canonical program assignment' };
    }

    let programSlug = app.program_slug ?? app.pathway_slug ?? null;
    if (!programSlug) {
      const { data: programRow, error: programError } = await db
        .from('programs')
        .select('slug')
        .eq('id', resolvedProgramId)
        .maybeSingle();
      if (programError || !programRow?.slug) {
        logger.error(
          '[approve] canonical program slug resolution failed',
          programError ? new Error(programError.message) : undefined,
          { resolvedProgramId, applicationId },
        );
        return { success: false, error: 'Failed to resolve canonical program' };
      }
      programSlug = programRow.slug;
      const { error: slugUpdateError } = await db
        .from('applications')
        .update({ program_slug: programSlug })
        .eq('id', applicationId);
      if (slugUpdateError) {
        logger.error('[approve] failed to persist canonical program slug', new Error(slugUpdateError.message), {
          applicationId,
          programSlug,
        });
        return { success: false, error: 'Failed to persist canonical program assignment' };
      }
    }

    const { data: pe, error: peErr } = await db
      .from('program_enrollments')
      .upsert(
        {
          user_id: userId,
          program_id: resolvedProgramId,
          program_slug: programSlug,
          email,
          full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
          amount_paid_cents: 0,
          funding_source: fundingType || 'pending',
          status: 'active',
          enrollment_state: 'active',
          funding_verified: false,
          payout_status: 'pending',
          at_risk: false,
        },
        { onConflict: 'user_id,program_slug', ignoreDuplicates: false },
      )
      .select('id')
      .maybeSingle();

    if (peErr || !pe?.id) {
      logger.error(
        '[approve] canonical program enrollment failed',
        peErr ? new Error(peErr.message) : undefined,
        { userId, resolvedProgramId, applicationId },
      );
      return { success: false, error: 'Failed to create canonical program enrollment' };
    }
    enrollmentId = pe.id;

    if (userId) await cachePortalTypeForEnrollment(db, userId, resolvedProgramId);

    // Course enrollment has one write authority: the synchronous database
    // trigger on active program_enrollments. Verify its result instead of
    // duplicating inserts in application code.
    const { data: courses, error: coursesError } = await db
      .from('lms_courses')
      .select('id')
      .eq('program_id', resolvedProgramId)
      .eq('is_active', true);
    if (coursesError) {
      logger.error('[approve] failed to load program courses', new Error(coursesError.message), {
        resolvedProgramId,
      });
      return { success: false, error: 'Failed to verify course provisioning' };
    }

    const courseIds = (courses ?? []).map((course: { id: string }) => course.id);
    if (courseIds.length > 0) {
      const { data: provisionedCourses, error: provisionError } = await db
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', userId)
        .in('course_id', courseIds);
      if (provisionError) {
        logger.error('[approve] failed to verify course enrollments', new Error(provisionError.message), {
          userId,
          resolvedProgramId,
        });
        return { success: false, error: 'Failed to verify course access' };
      }

      const provisionedIds = new Set(
        (provisionedCourses ?? []).map((row: { course_id: string }) => row.course_id),
      );
      const missingCourseIds = courseIds.filter((courseId: string) => !provisionedIds.has(courseId));
      if (missingCourseIds.length > 0) {
        logger.error('[approve] database course provisioning incomplete', undefined, {
          userId,
          resolvedProgramId,
          missingCourseIds,
        });
        return { success: false, error: 'Canonical course provisioning did not complete' };
      }
    }

    const { error: profileActivationError } = await db
      .from('profiles')
      .update({ enrollment_status: 'active' })
      .eq('id', userId);
    if (profileActivationError) {
      logger.error('[approve] learner profile activation failed', new Error(profileActivationError.message), {
        userId,
        enrollmentId,
      });
      return { success: false, error: 'Failed to activate learner profile' };
    }
  }

  const { error: approvalUpdateError } = await db
    .from('applications')
    .update({
      status: 'approved',
      user_id: userId,
      program_id: resolvedProgramId,
      eligibility_status: 'verified',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  if (approvalUpdateError) {
    logger.error('[approve] final application approval update failed', new Error(approvalUpdateError.message), {
      applicationId,
      userId,
      enrollmentId,
    });
    return { success: false, error: 'Failed to finalize application approval' };
  }

  if (userId && enrollmentId) {
    const binderResult = await ensureDigitalBinder({ db, userId, enrollmentId });
    if (binderResult.binderId) {
      logger.info('[approve] Digital binder created', {
        enrollmentId,
        binderId: binderResult.binderId,
      });
    }
  }

  const ATOMIC_SLUGS = new Set(['cna']);
  if (ATOMIC_SLUGS.has(app.program_slug ?? '')) {
    const { data: atomicResult, error: atomicErr } = await db.rpc(
      'approve_application_and_grant_access_atomic',
      { p_application_id: applicationId, p_actor_user_id: userId },
    );
    if (atomicErr) {
      if (
        atomicErr.message.includes('Could not find the function') ||
        atomicErr.message.includes('schema cache')
      ) {
        logger.warn('[approve] atomic RPC not found — falling back to application-layer path', {
          applicationId,
          slug: app.program_slug,
        });
        await attachPartnerRouting({ db, application: { ...app, user_id: userId } });
      } else {
        throw new Error(`Atomic approval failed (${app.program_slug}): ${atomicErr.message}`);
      }
    } else if (atomicResult?.status === 'blocked') {
      return { success: false, error: `Approval blocked: ${(atomicResult.blockers as string[]).join(', ')}` };
    }
  } else {
    await attachPartnerRouting({ db, application: { ...app, user_id: userId } });
  }

  try {
    await db
      .from('crm_leads')
      .update({
        stage: 'converted',
        status: 'won',
        profile_id: userId ?? null,
        enrollment_id: enrollmentId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('application_id', applicationId);
    await db
      .from('follow_up_reminders')
      .update({ status: 'completed' })
      .eq('application_id', applicationId)
      .eq('status', 'pending');
  } catch (crmErr) {
    logger.warn('[approve] CRM lead update failed (non-fatal)', crmErr);
  }

  logger.info('[approve] Application approved', {
    applicationId,
    userId,
    programId: resolvedProgramId,
    enrollmentId,
    isNewUser,
  });
  return { success: true, userId: userId!, enrollmentId, passwordSetupLink, tempPassword: null };
}
