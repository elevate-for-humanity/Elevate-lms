export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/applications/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sendgrid';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { approveApplication } from '@/lib/enrollment/approve';

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
async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;


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

    // Dedup: block same email + program within 24 hours.
    // Allows re-application after the window (e.g. student applies months later).
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentApp } = await supabase
      .from('applications')
      .select('id')
      .eq('email', body.email.toLowerCase().trim())
      .eq('program_interest', program)
      .gte('created_at', oneDayAgo)
      .limit(1)
      .maybeSingle();

    if (recentApp) {
      return NextResponse.json(
        { error: 'An application for this program was already submitted with this email in the last 24 hours. Please call 317-314-3757 if you need to make changes.' },
        { status: 409 }
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
        program_interest: program,
        program_slug: body.programSlug || body.program_slug || null,
        support_notes: notes,
        status: 'submitted',
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

    // Auto-approve through single pipeline
    let userId: string | null = null;
    let passwordSetupLink: string | null = null;
    try {
      const programSlug = body.programSlug || body.program || 'barber-apprenticeship';
      const { data: programRow } = await supabase
        .from('programs')
        .select('id')
        .eq('slug', programSlug)
        .maybeSingle();

      const result = await approveApplication(supabase, {
        applicationId: data.id,
        programId: programRow?.id || null,
        fundingType: body.fundingType || null,
      });

      if (result.success) {
        userId = result.userId || null;
        passwordSetupLink = result.passwordSetupLink || null;
        logger.info('[Applications] Auto-approved', {
          applicationId: data.id,
          userId,
          hasPasswordLink: !!passwordSetupLink,
        });
      } else {
        logger.warn('[Applications] Auto-approve failed (non-fatal)', { error: result.error });
      }
    } catch (approveErr) {
      logger.warn('[Applications] Auto-approve threw (non-fatal)', approveErr);
    }

    // Send email notifications — direct call, no self-fetch
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    let emailStatus: { student: string; staff: string } = { student: 'not-attempted', staff: 'not-attempted' };
    try {
      logger.info('[Applications] Sending confirmation email', { to: body.email, ref: referenceNumber, hasPasswordLink: !!passwordSetupLink });

      // Build password setup section (only for new users)
      const passwordSection = passwordSetupLink ? `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #065f46;">Your Student Account Is Ready</h3>
              <p style="margin-bottom: 16px;">We created your student portal account. Set your password to log in:</p>
              <p style="text-align: center; margin: 16px 0;">
                <a href="${passwordSetupLink}" style="display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Set Your Password &amp; Log In</a>
              </p>
              <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">This link expires in 24 hours. After setting your password, you can log in anytime at <a href="${siteUrl}/login" style="color: #059669;">${siteUrl}/login</a></p>
            </div>
      ` : '';

      // Confirmation + onboarding email to applicant
      const studentEmailResult = await sendEmail({
        to: body.email,
        subject: `Welcome to Elevate for Humanity — ${body.program} [Ref: ${referenceNumber}]`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="padding: 24px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 2px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px;">Welcome to Elevate for Humanity!</h1>
            </div>

            <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px;">Hi ${body.firstName},</p>
              <p>Your application for <strong>${body.program}</strong> has been received and your enrollment is being processed.</p>

              ${passwordSection}

              <h3 style="color: #0f172a;">What Happens Next</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 12px; vertical-align: top; width: 36px;">
                    <div style="width: 28px; height: 28px; background: #ea580c; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; font-size: 14px;">1</div>
                  </td>
                  <td style="padding: 10px 0;">
                    <strong>Set your password</strong> using the green button above to access your student portal.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background: #ea580c; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; font-size: 14px;">2</div>
                  </td>
                  <td style="padding: 10px 0;">
                    <strong>Complete orientation</strong> — a short online module (about 10 minutes) that unlocks your coursework.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background: #ea580c; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; font-size: 14px;">3</div>
                  </td>
                  <td style="padding: 10px 0;">
                    <strong>Advisor contact</strong> — we'll reach out within 1–2 business days via ${body.preferredContact || 'phone'} to discuss funding options and scheduling.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background: #ea580c; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; font-size: 14px;">4</div>
                  </td>
                  <td style="padding: 10px 0;">
                    <strong>Start training</strong> — once funding is confirmed, you begin your program.
                  </td>
                </tr>
              </table>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #ea580c;">Want to Talk Sooner?</h3>
                <p style="margin-bottom: 12px;">Schedule your advisor call now instead of waiting:</p>
                <a href="https://calendly.com/elevate-for-humanity/advisor-call" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Schedule Call Now</a>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Your Reference Number:</p>
                <p style="margin: 0; font-size: 20px; font-weight: bold; font-family: monospace; color: #0f172a;">${referenceNumber}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Application ID: ${data.id}</p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="${siteUrl}/apply/track?id=${data.id}&email=${encodeURIComponent(body.email)}" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Application Status</a>
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

      // Send staff email in parallel (don't wait for it to finish before responding)
      const staffEmailPromise = sendEmail({
        to: 'elevate4humanityedu@gmail.com',
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
          <p><strong>Status:</strong> Pending admin approval</p>
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
export const POST = withApiAudit('/api/applications', _POST);
