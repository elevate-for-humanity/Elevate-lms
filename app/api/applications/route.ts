export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/applications/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  rateLimitNew as rateLimit,
  getClientIdentifier,
  RATE_LIMITS,
} from '@/lib/rateLimit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/resend';

// CORS preflight for cross-origin form submissions
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Public endpoint — anonymous application submissions
export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Rate limiting: 3 requests per minute per IP
    const identifier = getClientIdentifier(req.headers);
    const rateLimitResult = await rateLimit(
      `applications:${identifier}`,
      RATE_LIMITS.APPLICATION_FORM
    );

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Basic required fields - core fields that all forms must have
    const coreRequired = [
      'firstName',
      'lastName',
      'phone',
      'email',
    ];

    // Program is required but can come from different field names
    const program = body.program || body.programSlug;
    if (!program) {
      return NextResponse.json(
        { error: 'Missing required field: program' },
        { status: 400 }
      );
    }

    for (const field of coreRequired) {
      if (!body[field] || String(body[field]).trim() === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please call 317-314-3757 for immediate assistance.' },
        { status: 503 }
      );
    }

    // Generate reference number
    const referenceNumber = `EFH-${Date.now().toString(36).toUpperCase()}`;

    // Build notes field with all the extra data
    const notes = [
      `Reference: ${referenceNumber}`,
      body.city ? `City: ${body.city}` : '',
      body.state ? `State: ${body.state}` : '',
      body.zip ? `ZIP: ${body.zip}` : '',
      `Program Interest: ${program}`,
      body.preferredContact ? `Preferred Contact: ${body.preferredContact}` : '',
      body.fundingType ? `Funding Type: ${body.fundingType}` : '',
      body.source ? `Source: ${body.source}` : '',
      body.hasHostShop ? `Has Host Shop: ${body.hasHostShop}` : '',
      body.hostShopName ? `Host Shop Name: ${body.hostShopName}` : '',
      body.howDidYouHear ? `How Did You Hear: ${body.howDidYouHear}` : '',
      body.hasCaseManager ? `Has Case Manager: ${body.hasCaseManager}` : '',
      body.caseManagerAgency ? `Case Manager Agency: ${body.caseManagerAgency}` : '',
      body.supportNeeds ? `Support Needs: ${body.supportNeeds}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    // Insert into applications table
    const { data, error }: any = await supabase
      .from('applications')
      .insert({
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.phone,
        email: body.email,
        city: body.city || 'Not provided',
        zip: body.zip || '00000',
        program_interest: program, // TEXT field for program name/slug
        support_notes: notes,
        status: 'pending',
        source: body.source || 'website',
        contact_preference: body.preferredContact || 'phone',
      })
      .select()
      .single();

    if (error) {
      const errorCode = (error as any)?.code || "UNKNOWN";
      const errorMessage = 'Internal server error';
      return NextResponse.json(
        {
          error:
            'Failed to save application. Please call 317-314-3757 for immediate assistance.',
          debug:
            process.env.NODE_ENV === 'development' ? 'Internal server error' : undefined,
        },
        { status: 500 }
      );
    }

    // Auto-approve: create auth user, profile, and enrollment record
    let userId: string | null = null;
    let isNewUser = false;
    let passwordSetupLink: string | null = null;
    try {
      // Check if user already exists by looking up profiles table first (fast, indexed)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', body.email.toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        userId = existingProfile.id;
      } else {
        // Create auth user with random password (student sets it via reset flow)
        const tempPassword = `Elv-${crypto.randomUUID().slice(0, 16)}!`;
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: body.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: `${body.firstName} ${body.lastName}`,
            role: 'student',
          },
        });
        if (!createErr && newUser?.user) {
          userId = newUser.user.id;
          isNewUser = true;
        } else {
          logger.warn('Auto-approve: could not create user', { email: body.email, error: createErr });
        }
      }

      if (userId) {
        // Upsert profile
        await supabase.from('profiles').upsert({
          id: userId,
          email: body.email,
          full_name: `${body.firstName} ${body.lastName}`,
          phone: body.phone,
          role: 'student',
          enrollment_status: 'active',
        }, { onConflict: 'id' });

        // Resolve program ID
        const { data: programRow } = await supabase
          .from('programs')
          .select('id')
          .eq('slug', body.programSlug || 'barber-apprenticeship')
          .maybeSingle();

        // Create enrollment record
        await supabase.from('program_enrollments').insert({
          user_id: userId,
          program_id: programRow?.id || null,
          email: body.email,
          full_name: `${body.firstName} ${body.lastName}`,
          amount_paid_cents: 0,
          funding_source: body.fundingType || 'self-pay',
          status: 'pending',
          enrollment_state: 'approved',
          next_required_action: 'COMPLETE_PAYMENT',
        });

        // Update application with user_id and approved status
        await supabase
          .from('applications')
          .update({ status: 'approved', user_id: userId, program_id: programRow?.id || null })
          .eq('id', data.id);

        logger.info('Application auto-approved', { userId, applicationId: data.id, program });

        // Generate password setup link for new users
        if (isNewUser) {
          try {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
            const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
              type: 'recovery',
              email: body.email,
              options: { redirectTo: `${siteUrl}/auth/reset-password` },
            });
            if (linkError) {
              logger.warn('[Applications] Password reset link generation failed', linkError);
            } else if (linkData?.properties?.action_link) {
              passwordSetupLink = linkData.properties.action_link;
              logger.info('[Applications] Password setup link generated', { email: body.email });
            }
          } catch (linkErr) {
            logger.warn('[Applications] Password link generation threw', linkErr);
          }
        }
      }
    } catch (autoApproveErr) {
      // Non-fatal — application is saved, payment can proceed
      logger.warn('Auto-approve failed (non-fatal)', autoApproveErr);
    }

    // Send email notifications — direct call, no self-fetch
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    let emailStatus: { student: string; staff: string } = { student: 'not-attempted', staff: 'not-attempted' };
    try {
      logger.info('[Applications] Sending confirmation email', { to: body.email, ref: referenceNumber, hasPasswordLink: !!passwordSetupLink });

      // Build password setup section (only for new users)
      const passwordSection = passwordSetupLink ? `
            <div style="background: #ecfdf5; border: 2px solid #6ee7b7; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #065f46;">Your Student Account Is Ready</h3>
              <p style="margin-bottom: 16px;">We created your student portal account. Set your password to log in:</p>
              <p style="text-align: center; margin: 16px 0;">
                <a href="${passwordSetupLink}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Set Your Password &amp; Log In</a>
              </p>
              <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">This link expires in 24 hours. After setting your password, you can log in anytime at <a href="${siteUrl}/signin" style="color: #059669;">${siteUrl}/signin</a></p>
            </div>
      ` : '';

      // Confirmation + onboarding email to applicant
      const studentEmailResult = await sendEmail({
        to: body.email,
        subject: `Welcome to Elevate for Humanity — ${body.program} [Ref: ${referenceNumber}]`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f97316; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Welcome to Elevate for Humanity!</h1>
            </div>

            <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px;">Hi ${body.firstName},</p>
              <p>Your application for <strong>${body.program}</strong> has been received and your enrollment is being processed.</p>

              <div style="background: #f1f5f9; border: 2px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Your Reference Number:</p>
                <p style="margin: 0; font-size: 20px; font-weight: bold; font-family: monospace; color: #0f172a;">${referenceNumber}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Application ID: ${data.id}</p>
              </div>

              ${passwordSection}

              <h3 style="color: #0f172a;">What Happens Next</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 12px; vertical-align: top; width: 36px;">
                    <div style="width: 28px; height: 28px; background: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; font-size: 14px;">1</div>
                  </td>
                  <td style="padding: 10px 0;">
                    <strong>Set your password</strong> using the link above to access your student portal.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; font-size: 14px;">2</div>
                  </td>
                  <td style="padding: 10px 0;">
                    <strong>Complete orientation</strong> — a short online module (about 10 minutes) that unlocks your coursework.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; font-size: 14px;">3</div>
                  </td>
                  <td style="padding: 10px 0;">
                    <strong>Advisor contact</strong> — we'll reach out within 1–2 business days via ${body.preferredContact || 'phone'} to discuss funding options and scheduling.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; font-size: 14px;">4</div>
                  </td>
                  <td style="padding: 10px 0;">
                    <strong>Start training</strong> — once funding is confirmed, you begin your program.
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin: 24px 0;">
                <a href="${siteUrl}/apply/track?id=${data.id}&email=${encodeURIComponent(body.email)}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Application Status</a>
              </div>

              <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #ea580c;">Want to Talk Sooner?</h3>
                <p style="margin-bottom: 12px;">Schedule your advisor call now instead of waiting:</p>
                <a href="https://calendly.com/elevate-for-humanity/advisor-call" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Schedule Call Now</a>
              </div>

              <p>Questions? Call us at <a href="tel:3173143757" style="color: #ea580c; font-weight: bold;">317-314-3757</a> or email <a href="mailto:info@elevateforhumanity.org" style="color: #ea580c;">info@elevateforhumanity.org</a></p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #64748b; font-size: 13px; text-align: center;">
                Elevate for Humanity Career &amp; Technical Institute<br />
                8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240<br />
                <a href="${siteUrl}" style="color: #3b82f6;">www.elevateforhumanity.org</a>
              </p>
            </div>
          </div>
        `,
      });

      if (studentEmailResult.success) {
        logger.info('[Applications] Student email sent', { to: body.email, id: studentEmailResult.data?.id });
      } else {
        logger.error('[Applications] Student email FAILED', { error: studentEmailResult.error, to: body.email });
      }

      // Notification email to staff
      const staffEmailResult = await sendEmail({
        to: 'info@elevateforhumanity.org',
        subject: `New Application [${referenceNumber}]: ${body.firstName} ${body.lastName} - ${body.program}`,
        html: `
          <h2>New Application Received</h2>
          <p><strong>Reference:</strong> ${referenceNumber}</p>
          <p><strong>Name:</strong> ${body.firstName} ${body.lastName}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          <p><strong>Phone:</strong> ${body.phone}</p>
          <p><strong>Program:</strong> ${body.program}</p>
          <p><strong>Location:</strong> ${body.city || 'N/A'}, ${body.zip || 'N/A'}</p>
          <p><strong>Preferred Contact:</strong> ${body.preferredContact || 'phone'}</p>
          <p><strong>Auto-Approved:</strong> ${userId ? 'Yes' : 'No'} ${isNewUser ? '(new account created)' : '(existing user)'}</p>
          ${body.hasCaseManager ? `<p><strong>Has Case Manager:</strong> ${body.hasCaseManager}</p>` : ''}
          ${body.caseManagerAgency ? `<p><strong>Agency:</strong> ${body.caseManagerAgency}</p>` : ''}
          ${body.supportNeeds ? `<p><strong>Support Needs:</strong> ${body.supportNeeds}</p>` : ''}
          <p><a href="https://www.elevateforhumanity.org/admin/applications">View in Admin Portal</a></p>
        `,
      });

      if (staffEmailResult.success) {
        logger.info('[Applications] Staff email sent', { id: staffEmailResult.data?.id });
      } else {
        logger.error('[Applications] Staff email FAILED', { error: staffEmailResult.error });
      }
      emailStatus = {
        student: studentEmailResult.success ? 'sent' : studentEmailResult.error || 'failed',
        staff: staffEmailResult.success ? 'sent' : staffEmailResult.error || 'failed',
      };
    } catch (emailError) {
      logger.error('[Applications] Email send threw exception', emailError instanceof Error ? emailError : undefined);
      emailStatus = { student: 'exception', staff: 'exception' };
    }

    return NextResponse.json(
      {
        ok: true,
        id: data.id,
        email: data.email,
        program: data.program_id,
        referenceNumber: referenceNumber,
        emailStatus,
      },
      { status: 200 }
    );
  } catch (error) { 
    return NextResponse.json(
      {
        error:
          'Unexpected error. Please call 317-314-3757 for immediate assistance.',
      },
      { status: 500 }
    );
  }
}
