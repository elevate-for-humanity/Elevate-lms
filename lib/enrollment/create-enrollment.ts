/**
 * Shared enrollment creation logic
 * Used by Stripe, Sezzle, and Affirm webhooks to create enrollments.
 * Authoritative enrollment activator for all payment rails.
 */

import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface EnrollmentParams {
  studentId?: string;
  programId: string;
  programSlug?: string;
  courseId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  fundingSource?: string;
  applicationId?: string;
  paymentProvider: 'stripe' | 'sezzle' | 'sezzle_virtual_card' | 'affirm';
  paymentReference?: string;
  paymentAmountCents?: number;
}

interface EnrollmentResult {
  success: boolean;
  enrollmentId?: string;
  studentId?: string;
  isNewUser?: boolean;
  isNewEnrollment?: boolean;
  error?: string;
}

export async function createEnrollmentFromPayment(
  params: EnrollmentParams,
): Promise<EnrollmentResult> {
  const {
    studentId: initialStudentId,
    programId,
    programSlug,
    courseId,
    email,
    firstName,
    lastName,
    phone,
    fundingSource = 'self_pay',
    applicationId,
    paymentProvider,
    paymentReference,
    paymentAmountCents,
  } = params;

  try {
    const { requireAdminClient: getAdminClient } = await import('@/lib/supabase/admin');
    const { setAuditContext } = await import('@/lib/audit-context');
    // The generated database schema does not model Supabase Auth admin methods,
    // which can incorrectly narrow listUsers/createUser results to `never` during
    // Next production type-checking. Keep the escape hatch at this integration
    // boundary rather than weakening types throughout the application.
    const supabaseAdmin: any = await getAdminClient();

    if (!supabaseAdmin) {
      logger.error('[Enrollment] getAdminClient returned null — SUPABASE_SERVICE_ROLE_KEY missing');
      return { success: false, error: 'Database configuration error' };
    }

    await setAuditContext(supabaseAdmin, { systemActor: 'enrollment_creation' });

    let finalStudentId = initialStudentId;
    let isNewUser = false;
    let tempPassword = '';

    if (!finalStudentId && email) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users?.find(
        (u: { id: string; email?: string | null }) => u.email?.toLowerCase() === email.toLowerCase(),
      );

      if (userExists) {
        finalStudentId = userExists.id;
        logger.info('[Enrollment] Found existing user', { email, userId: finalStudentId });
      } else {
        tempPassword = `EFH-${randomBytes(8).toString('hex')}-Temp!`;

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email.toLowerCase(),
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: firstName || '',
            last_name: lastName || '',
          },
        });

        if (createError) {
          logger.error('[Enrollment] Failed to create user account', createError);
          return { success: false, error: 'Failed to create user account' };
        }

        if (newUser?.user) {
          finalStudentId = newUser.user.id;
          isNewUser = true;
          logger.info('[Enrollment] Created new user account', { email, userId: finalStudentId });

          await supabaseAdmin.from('profiles').upsert({
            id: finalStudentId,
            email: email.toLowerCase(),
            full_name: `${firstName || ''} ${lastName || ''}`.trim(),
            first_name: firstName || '',
            last_name: lastName || '',
            phone: phone || null,
            role: 'student',
            onboarding_completed: true,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    if (!finalStudentId) {
      logger.warn('[Enrollment] Could not determine student ID');
      return { success: false, error: 'Could not determine student ID' };
    }

    if (applicationId) {
      await supabaseAdmin
        .from('applications')
        .update({
          // Preserve admissions decisions: financial settlement cannot approve an application.
          payment_status: 'paid',
          payment_provider: paymentProvider,
          payment_reference: paymentReference,
          payment_amount_cents: paymentAmountCents,
          payment_completed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
    }

    const { data: existing } = await supabaseAdmin
      .from('program_enrollments')
      .select('id, status, revoked_at, suspended_at, cancelled_at, refunded_at')
      .eq('student_id', finalStudentId)
      .eq('program_id', programId)
      .maybeSingle();

    // Do not reactivate revoked, cancelled, suspended or refunded learner records after a new payment event.
    if (existing && (existing.revoked_at || existing.suspended_at || existing.cancelled_at || existing.refunded_at ||
      ['revoked', 'suspended', 'cancelled', 'withdrawn'].includes(String(existing.status || '').toLowerCase()))) {
      return { success: false, error: 'Enrollment reinstatement requires administrator review' };
    }

    let enrollmentId: string | null = null;
    let isNewEnrollment = false;

    if (!existing) {
      const { data: newEnrollment, error: enrollError } = await supabaseAdmin
        .from('program_enrollments')
        .insert({
          student_id: finalStudentId,
          program_id: programId,
          ...(programSlug ? { program_slug: programSlug } : {}),
          ...(courseId ? { course_id: courseId } : {}),
          status: 'pending',
          enrollment_state: 'applied',
          access_status: 'pending',
          next_required_action: 'ADMIN_APPROVAL_REQUIRED',
          payment_status: 'paid',
          payment_provider: paymentProvider,
          payment_reference: paymentReference,
          payment_amount_cents: paymentAmountCents,
          funding_source: fundingSource,
          enrolled_at: new Date().toISOString(),
          access_granted_at: null,
        })
        .select('id')
        .maybeSingle();

      if (enrollError) {
        logger.error('[Enrollment] Failed to create enrollment', enrollError);
        return { success: false, error: 'Failed to create enrollment' };
      }

      enrollmentId = newEnrollment?.id || null;
      isNewEnrollment = true;
      logger.info('[Enrollment] Created new enrollment', {
        studentId: finalStudentId,
        programId,
        enrollmentId,
        paymentProvider,
      });
    } else {
      // Settlement updates billing only for an existing enrollment. The
      // administrator owns its admission state and may approve it concurrently.
      const { error: paymentUpdateError } = await supabaseAdmin
        .from('program_enrollments')
        .update({
          payment_status: 'paid',
          payment_provider: paymentProvider,
          payment_reference: paymentReference,
          payment_amount_cents: paymentAmountCents,
        })
        .eq('id', existing.id);

      if (paymentUpdateError) {
        logger.error('[Enrollment] Failed to record payment on existing enrollment', paymentUpdateError);
        return { success: false, error: 'Failed to update enrollment payment' };
      }

      enrollmentId = existing.id;
    }

    if (isNewEnrollment && email) {
      await sendEnrollmentWelcomeEmail({
        email,
        firstName,
        programId,
        isNewUser,
        tempPassword,
        supabaseAdmin,
      });
    }

    try {
      const { logAuditEvent } = await import('@/lib/audit');
      await logAuditEvent({
        action: 'ENROLLMENT_CREATED_FROM_PAYMENT',
        actor_id: 'system:enrollment_creation',
        resourceType: 'program_enrollment',
        resourceId: enrollmentId || undefined,
        metadata: {
          student_id: finalStudentId,
          program_id: programId,
          payment_provider: paymentProvider,
          payment_reference: paymentReference,
          is_new_user: isNewUser,
          is_new_enrollment: isNewEnrollment,
        },
      });
    } catch {
      /* audit best-effort */
    }

    return {
      success: true,
      enrollmentId: enrollmentId || undefined,
      studentId: finalStudentId,
      isNewUser,
      isNewEnrollment,
    };
  } catch (error) {
    logger.error('[Enrollment] Error creating enrollment', error);
    return { success: false, error: 'Operation failed' };
  }
}

async function sendEnrollmentWelcomeEmail(params: {
  email: string;
  firstName?: string;
  programId: string;
  isNewUser: boolean;
  tempPassword: string;
  supabaseAdmin: any;
}) {
  const { email, firstName, programId, isNewUser, supabaseAdmin } = params;

  try {
    const { data: programDetails } = await supabaseAdmin
      .from('programs')
      .select('name')
      .eq('id', programId)
      .maybeSingle();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
    const loginSection = isNewUser
      ? `
          <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:16px 20px;margin:20px 0;">
            <p style="margin:0 0 4px;font-size:12px;color:#9a3412;font-weight:700;">SECURE ACCOUNT SETUP REQUIRED</p>
            <p style="margin:0;font-size:13px;color:#7c2d12;">For security, we do not send passwords by email. Use the link below to set your password and access your student portal.</p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${siteUrl}/login" style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">Set Password &amp; Log In</a>
          </div>`
      : `
          <div style="text-align: center; margin: 24px 0;">
            <a href="${siteUrl}/login" style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">Login to Student Portal</a>
          </div>`;

    await fetch(`${siteUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.CRON_SECRET ?? '',
      },
      body: JSON.stringify({
        to: email,
        subject: `Payment Received - ${programDetails?.name || 'Your Program'} Pending Enrollment Review`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a8a;">Payment received by ${PLATFORM_DEFAULTS.orgName}</h2>
            <p>Hi ${firstName || 'there'},</p>
            <p>We received your payment for <strong>${programDetails?.name || 'your program'}</strong>. Your application and payment are recorded. Training access remains <strong>pending administrator approval</strong>. You may sign in to complete required onboarding steps; coursework is not unlocked until approval.</p>
            ${loginSection}
            <h3>What's Next?</h3>
            <ul>
              <li>Log in to your student portal</li>
              <li>Complete or review your profile</li>
              <li>Complete orientation and required documents, then await the administrator's access decision</li>
            </ul>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The ${PLATFORM_DEFAULTS.orgName} Team</p>
          </div>`,
      }),
    });

    logger.info('[Enrollment] Payment/enrollment acknowledgement sent', { email, programId });
  } catch (error) {
    logger.error('[Enrollment] Failed to send payment/enrollment acknowledgement', error);
  }
}
