/**
 * Shared enrollment creation logic
 * Used by both Stripe and Sezzle webhooks to create enrollments
 */

import { logger } from '@/lib/logger';

interface EnrollmentParams {
  studentId?: string;
  programId: string;
  programSlug?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  fundingSource?: string;
  applicationId?: string;
  paymentProvider: 'stripe' | 'sezzle' | 'sezzle_virtual_card';
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
  params: EnrollmentParams
): Promise<EnrollmentResult> {
  const {
    studentId: initialStudentId,
    programId,
    programSlug,
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
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabaseAdmin = createAdminClient();

    if (!supabaseAdmin) {
      logger.error('[Enrollment] createAdminClient returned null — SUPABASE_SERVICE_ROLE_KEY missing');
      return { success: false, error: 'Database configuration error' };
    }

    let finalStudentId = initialStudentId;
    let isNewUser = false;
    let tempPassword = '';

    // If no studentId, find or create user account
    if (!finalStudentId && email) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (userExists) {
        finalStudentId = userExists.id;
        logger.info('[Enrollment] Found existing user', { email, userId: finalStudentId });
      } else {
        // Generate temporary password
        tempPassword = `Elevate${Math.random().toString(36).slice(-8)}!`;

        // Create new user account
        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
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
          logger.info('[Enrollment] Created new user account', {
            email,
            userId: finalStudentId,
          });

          // Create profile
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

    // Update application status if exists
    if (applicationId) {
      await supabaseAdmin
        .from('applications')
        .update({
          status: 'accepted',
          payment_status: 'paid',
          payment_provider: paymentProvider,
          payment_reference: paymentReference,
          payment_amount_cents: paymentAmountCents,
          payment_completed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
    }

    // Check for existing enrollment (idempotency)
    const { data: existing } = await supabaseAdmin
      .from('program_enrollments')
      .select('id, status')
      .eq('student_id', finalStudentId)
      .eq('program_id', programId)
      .maybeSingle();

    let enrollmentId: string | null = null;
    let isNewEnrollment = false;

    if (!existing) {
      // Create new enrollment
      const { data: newEnrollment, error: enrollError } = await supabaseAdmin
        .from('program_enrollments')
        .insert({
          student_id: finalStudentId,
          program_id: programId,
          status: 'active',
          payment_status: 'paid',
          payment_provider: paymentProvider,
          payment_reference: paymentReference,
          payment_amount_cents: paymentAmountCents,
          funding_source: fundingSource,
          enrolled_at: new Date().toISOString(),
        })
        .select('id')
        .single();

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
    } else if (existing.status !== 'active') {
      // Activate existing enrollment
      await supabaseAdmin
        .from('program_enrollments')
        .update({
          status: 'active',
          payment_status: 'paid',
          payment_provider: paymentProvider,
          payment_reference: paymentReference,
          payment_amount_cents: paymentAmountCents,
          enrolled_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      enrollmentId = existing.id;
      isNewEnrollment = true;

      logger.info('[Enrollment] Activated existing enrollment', {
        enrollmentId: existing.id,
        paymentProvider,
      });
    } else {
      enrollmentId = existing.id;
      logger.info('[Enrollment] Enrollment already active', {
        enrollmentId: existing.id,
      });
    }

    // Send welcome email for new enrollments
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

    return {
      success: true,
      enrollmentId: enrollmentId || undefined,
      studentId: finalStudentId,
      isNewUser,
      isNewEnrollment,
    };
  } catch (error) {
    logger.error('[Enrollment] Error creating enrollment', error);
    return {
      success: false,
      error: 'Operation failed',
    };
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
  const { email, firstName, programId, isNewUser, tempPassword, supabaseAdmin } = params;

  try {
    const { data: programDetails } = await supabaseAdmin
      .from('programs')
      .select('name')
      .eq('id', programId)
      .single();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    const loginSection =
      isNewUser && tempPassword
        ? `
          <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #166534;">Your Account Has Been Created!</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p style="color: #dc2626; font-weight: bold;">Please change your password after your first login.</p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${siteUrl}/login" style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">Login to Student Portal</a>
          </div>
        `
        : `
          <div style="text-align: center; margin: 24px 0;">
            <a href="${siteUrl}/login" style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">Login to Student Portal</a>
          </div>
        `;

    await fetch(`${siteUrl}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `Welcome to ${programDetails?.name || 'Your Program'} - Your Access is Ready!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a8a;">Welcome to Elevate for Humanity!</h2>
            <p>Hi ${firstName || 'there'},</p>
            <p>Congratulations! Your enrollment in <strong>${programDetails?.name || 'your program'}</strong> is now <span style="color: #22c55e; font-weight: bold;">ACTIVE</span>.</p>
            
            ${loginSection}
            
            <h3>What's Next?</h3>
            <ul>
              <li>Log in to your student portal</li>
              <li>Complete your profile</li>
              <li>Start your coursework</li>
            </ul>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The Elevate for Humanity Team</p>
          </div>
        `,
      }),
    });

    logger.info('[Enrollment] Welcome email sent', { email, programId });
  } catch (error) {
    logger.error('[Enrollment] Failed to send welcome email', error);
  }
}
