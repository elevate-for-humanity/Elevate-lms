
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

interface CompleteEnrollmentRequest {
  sessionId: string;
  applicationId: string;
  programSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  amountPaid?: number;
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body: CompleteEnrollmentRequest = await req.json();
    const {
      sessionId,
      applicationId,
      programSlug,
      firstName,
      lastName,
      email,
      phone,
      amountPaid,
    } = body;

    const supabase = await createClient();
    const emailLower = email.toLowerCase();

    logger.info('Starting enrollment completion', {
      sessionId,
      applicationId,
      email: emailLower,
    });

    // Step 1: Get program details
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name, slug')
      .eq('slug', programSlug)
      .single();

    if (programError || !program) {
      throw new Error(`Program not found: ${programSlug}`);
    }

    // Step 2: Check if user already exists
    let userId: string;
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailLower)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      logger.info('User already exists', { userId, email: emailLower });
    } else {
      // Step 3: Create auth user with temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: emailLower,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName,
          },
        });

      if (authError || !authData.user) {
        logger.error('Auth user creation error', authError);
        throw new Error('Failed to create user account');
      }

      userId = authData.user.id;

      // Step 4: Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email: emailLower,
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        phone: phone ?? null,
        role: 'student',
      });

      if (profileError) {
        logger.error('Profile creation error', profileError);
        throw profileError;
      }

      logger.info('Created new user', { userId, email: emailLower });

      // Step 5: Send password reset email so student can set their password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        emailLower,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
        }
      );

      if (resetError) {
        logger.warn('Password reset email failed', resetError);
      }
    }

    // Step 6: Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('program_id', program.id)
      .single();

    let enrollmentId: string;

    if (existingEnrollment) {
      enrollmentId = existingEnrollment.id;
      logger.info('Student already enrolled', { enrollmentId });

      // Update status to pending (keep pending until approval)
      await supabase
        .from('enrollments')
        .update({
          status: 'pending',
          payment_status: 'paid',
          stripe_checkout_session_id: sessionId,
        })
        .eq('id', enrollmentId);
    } else {
      // Step 7: Create enrollment (pending until approval)
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          program_id: program.id,
          status: 'pending',
          payment_status: 'paid',
          stripe_checkout_session_id: sessionId,
        })
        .select('id')
        .single();

      if (enrollError) {
        logger.error('Enrollment creation error', enrollError);
        throw enrollError;
      }

      enrollmentId = enrollment.id;
      logger.info('Created enrollment', {
        enrollmentId,
        userId,
        programId: program.id,
      });

      // Notify admins of pending enrollment
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'super_admin']);

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          type: 'system',
          title: 'New Enrollment Pending Approval',
          message: `${firstName} ${lastName} (${email}) has completed payment for ${program.name}. Enrollment ID: ${enrollmentId}`,
        }));

        await supabase.from('notifications').insert(notifications);
        logger.info('Admin notifications created', { count: admins.length });
      }
    }

    // Step 8: Update application status
    await supabase
      .from('applications')
      .update({
        status: 'approved',
      })
      .eq('id', applicationId);

    // Step 9: Mark Milady access granted (link-based, no API)
    // Student will receive Milady signup link in welcome email
    if (programSlug === 'barber-apprenticeship') {
      await supabase
        .from('enrollments')
        .update({ milady_enrolled: true })
        .eq('id', enrollmentId);
      logger.info('Milady access granted (link-based)', { userId, enrollmentId });
    }

    // Step 10: Send welcome email with Milady link
    try {
      const { sendWelcomeEmail } = await import('@/lib/email/resend');
      const isBarberProgram = programSlug === 'barber-apprenticeship' || 
        program.name.toLowerCase().includes('barber') ||
        program.name.toLowerCase().includes('apprentice');
      
      await sendWelcomeEmail({
        email: emailLower,
        name: `${firstName} ${lastName}`,
        programName: program.name,
        dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/lms`,
        includesMilady: isBarberProgram, // Include Milady signup link for barber programs
      });
      logger.info('Welcome email sent with Milady link', { email: emailLower, includesMilady: isBarberProgram });
    } catch (emailError) {
      logger.warn('Welcome email failed', emailError);
      // Don't fail enrollment if email fails
    }

    logger.info('Enrollment completed successfully', {
      userId,
      enrollmentId,
      programId: program.id,
    });

    return NextResponse.json({
      ok: true,
      userId,
      enrollmentId,
      message: 'Enrollment completed successfully',
    });
  } catch (err: any) {
    logger.error('Enrollment completion err', err);
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Internal server err' },
      { status: 500 }
    );
  }
}
