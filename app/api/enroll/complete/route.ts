

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

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

async function _POST(req: Request) {
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

      // Step 5: Send password setup email via SendGrid (Supabase SMTP not configured)
      try {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: emailLower,
          options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password` },
        });
        if (linkError) {
          logger.warn('Recovery link generation failed', linkError);
        } else if (linkData?.properties?.action_link) {
          const { sendEmail } = await import('@/lib/email/sendgrid');
          await sendEmail({
            to: emailLower,
            subject: 'Set Your Password — Elevate for Humanity',
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2>Welcome to Elevate for Humanity!</h2><p>Your account has been created. Click below to set your password:</p><p style="text-align:center;margin:24px 0"><a href="${linkData.properties.action_link}" style="background:#dc2626;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold">Set Password</a></p><p style="color:#64748b;font-size:13px">This link expires in 24 hours.</p></div>`,
          });
        }
      } catch (err) {
        logger.warn('Password setup email failed', err);
      }
    }

    // Step 6: Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('program_enrollments')
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
        .from('program_enrollments')
        .update({
          status: 'pending',
          payment_status: 'paid',
          stripe_checkout_session_id: sessionId,
        })
        .eq('id', enrollmentId);
    } else {
      // Step 7: Create enrollment (pending until approval)
      const { data: enrollment, error: enrollError } = await supabase
        .from('program_enrollments')
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
        .from('program_enrollments')
        .update({ milady_enrolled: true })
        .eq('id', enrollmentId);
      logger.info('Milady access granted (link-based)', { userId, enrollmentId });
    }

    // Step 10: Send welcome email with Milady link
    try {
      const { sendWelcomeEmail } = await import('@/lib/email/sendgrid');
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
export const POST = withApiAudit('/api/enroll/complete', _POST);
