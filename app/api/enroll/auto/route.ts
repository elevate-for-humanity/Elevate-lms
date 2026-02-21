/**
 * @deprecated Use canonical enrollment routes:
 *   - /api/enroll (student enrollment)
 *   - /api/enrollment/submit (comprehensive wizard)
 *   - /api/enrollments/create-enforced (admin/partner)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

interface AutoEnrollRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  programSlug: string;
  notes?: string;
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    const body: AutoEnrollRequest = await req.json();
    const { firstName, lastName, email, phone, programSlug, notes } = body;

    if (!firstName || !lastName || !email || !programSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const emailLower = email.toLowerCase();

    logger.info('Starting auto-enrollment', { email: emailLower, programSlug });

    // STEP 1: Get program details
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name, slug, total_cost')
      .eq('slug', programSlug)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // STEP 2: Check if user exists
    let userId: string;
    let isNewUser = false;

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailLower)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      logger.info('User already exists', { userId });
    } else {
      // STEP 3: Create auth user
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
        logger.error('Auth user creation failed', authError);
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        );
      }

      userId = authData.user.id;
      isNewUser = true;

      // STEP 4: Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email: emailLower,
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        phone: phone ?? null,
        role: 'student',
        enrollment_status: 'pending', // Requires approval before portal access
      });

      if (profileError) {
        logger.error('Profile creation failed', profileError);
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        );
      }

      logger.info('Created new user', { userId });
    }

    // STEP 5: Create enrollment (FREE - no payment required)
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('program_id', program.id)
      .single();

    let enrollmentId: string;

    if (existingEnrollment) {
      enrollmentId = existingEnrollment.id;
      logger.info('Enrollment already exists', { enrollmentId });
    } else {
      // Idempotent upsert — safe against race conditions
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .upsert({
          user_id: userId,
          program_id: program.id,
          status: 'pending',
          payment_status: 'waived',
        }, {
          onConflict: 'user_id,program_id',
          ignoreDuplicates: false,
        })
        .select('id')
        .single();

      if (enrollError) {
        logger.error('Enrollment creation failed', enrollError);
        return NextResponse.json(
          { error: 'Failed to create enrollment' },
          { status: 500 }
        );
      }

      enrollmentId = enrollment.id;
      logger.info('Created FREE enrollment', { enrollmentId });

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
          message: `${firstName} ${lastName} (${emailLower}) has enrolled in ${program.name}. Enrollment ID: ${enrollmentId}`,
        }));

        await supabase.from('notifications').insert(notifications);
        logger.info('Admin notifications created', { count: admins.length });
      }
    }

    // STEP 6: Create application record
    const { data: application } = await supabase
      .from('applications')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: emailLower,
        phone: phone ?? null,
        program_id: programSlug,
        status: 'approved',
      })
      .select('id')
      .single();

    // STEP 7: Send password reset email for new users via Resend
    if (isNewUser) {
      try {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: emailLower,
          options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password` },
        });
        if (linkError) {
          logger.warn('Recovery link generation failed', linkError);
        } else if (linkData?.properties?.action_link) {
          const { sendEmail } = await import('@/lib/email/resend');
          await sendEmail({
            to: emailLower,
            subject: 'Set Your Password — Elevate for Humanity',
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2>Welcome to Elevate for Humanity!</h2><p>Your account has been created. Click below to set your password:</p><p style="text-align:center;margin:24px 0"><a href="${linkData.properties.action_link}" style="background:#dc2626;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold">Set Password</a></p><p style="color:#64748b;font-size:13px">This link expires in 24 hours.</p></div>`,
          });
          logger.info('Password setup email sent', { email: emailLower });
        }
      } catch (err) {
        logger.warn('Password reset email failed', err);
      }
    }

    // STEP 8: For barber program, create Stripe checkout for Elevate to pay $295
    // Note: Student doesn't pay - this is for Elevate's internal payment tracking
    if (programSlug === 'barber-apprenticeship') {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: 'accounting@www.elevateforhumanity.org', // Elevate pays, not student
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Milady RISE Fee - ${firstName} ${lastName}`,
                description: `Student: ${emailLower} | Program: Barber Apprenticeship`,
              },
              unit_amount: 29500, // $295.00
            },
            quantity: 1,
          },
        ],
        success_url: `${siteUrl}/enroll/success?session_id={CHECKOUT_SESSION_ID}&student=${userId}`,
        cancel_url: `${siteUrl}/enroll/success?enrolled=true&student=${userId}`,
        metadata: {
          userId,
          enrollmentId,
          applicationId: application?.id || '',
          programId: program.id,
          programSlug: program.slug,
          studentFirstName: firstName,
          studentLastName: lastName,
          studentEmail: emailLower,
          paymentType: 'milady_rise_elevate_pays',
          paidBy: 'elevate',
        },
        payment_method_types: ['card'],
        automatic_tax: { enabled: true },
      });

      if (!session.url) {
        return NextResponse.json(
          { error: 'Failed to create checkout session' },
          { status: 500 }
        );
      }

      logger.info(
        'Enrollment complete, Stripe checkout created for Elevate payment',
        {
          userId,
          enrollmentId,
          sessionId: session.id,
        }
      );

      return NextResponse.json({
        ok: true,
        userId,
        enrollmentId,
        checkoutUrl: session.url,
        sessionId: session.id,
        message: 'Enrollment successful! Processing Milady RISE payment...',
      });
    }

    // STEP 9: For non-barber programs, enrollment is complete
    logger.info('FREE enrollment complete', {
      userId,
      enrollmentId,
      programSlug,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return NextResponse.json({
      ok: true,
      userId,
      enrollmentId,
      redirectUrl: `${siteUrl}/enroll/success?enrolled=true`,
      message: 'Enrollment successful! Check your email to set your password.',
    });
  } catch (err: any) {
    logger.error('Auto-enrollment err', err);
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Internal server err' },
      { status: 500 }
    );
  }
}
