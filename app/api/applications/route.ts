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
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1 });
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === body.email.toLowerCase()
      );

      if (existingUser) {
        userId = existingUser.id;
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

        logger.info('Barber application auto-approved', { userId, applicationId: data.id });
      }
    } catch (autoApproveErr) {
      // Non-fatal — application is saved, payment can proceed
      logger.warn('Auto-approve failed (non-fatal)', autoApproveErr);
    }

    // Send email notifications
    try {
      // Send confirmation email to applicant
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/api/email/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: body.email,
            subject: `Application Received [Ref: ${referenceNumber}] - Elevate for Humanity`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ea580c;">Application Received!</h2>
              <p>Hi ${body.firstName},</p>
              <p>We've received your application for our <strong>${body.program}</strong> program.</p>

              <div style="background: #f1f5f9; border: 2px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Your Application ID:</p>
                <p style="margin: 0; font-size: 20px; font-weight: bold; font-family: monospace; color: #0f172a;">${data.id}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Reference: ${referenceNumber}</p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="https://www.elevateforhumanity.org/apply/track?id=${data.id}&email=${encodeURIComponent(body.email)}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Application Status</a>
              </div>

              <h3 style="color: #0f172a;">What Happens Next?</h3>
              <ol style="line-height: 1.8;">
                <li>We review your application and check funding eligibility</li>
                <li>An advisor will contact you within 1-2 business days via ${body.preferredContact}</li>
                <li>We'll discuss program details, funding options (WIOA, WRG, JRI), and next steps</li>
              </ol>

              <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #ea580c;">Want to Talk Sooner?</h3>
                <p>Schedule your advisor call now instead of waiting:</p>
                <a href="https://calendly.com/elevate-for-humanity/advisor-call" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Schedule Call Now</a>
              </div>

              <p>Questions? Call us at <a href="tel:3173143757" style="color: #ea580c; font-weight: bold;">317-314-3757</a></p>
              <p>Best regards,<br><strong>Elevate for Humanity Team</strong></p>
            </div>
          `,
          }),
        }
      );

      // Send notification to staff
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/api/email/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'info@elevateforhumanity.org',
            subject: `New Application [${referenceNumber}]: ${body.firstName} ${body.lastName} - ${body.program}`,
            html: `
            <h2>New Application Received</h2>
            <p><strong>Reference:</strong> ${referenceNumber}</p>
            <p><strong>Name:</strong> ${body.firstName} ${body.lastName}</p>
            <p><strong>Email:</strong> ${body.email}</p>
            <p><strong>Phone:</strong> ${body.phone}</p>
            <p><strong>Program:</strong> ${body.program}</p>
            <p><strong>Location:</strong> ${body.city}, ${body.zip}</p>
            <p><strong>Preferred Contact:</strong> ${body.preferredContact}</p>
            ${body.hasCaseManager ? `<p><strong>Has Case Manager:</strong> ${body.hasCaseManager}</p>` : ''}
            ${body.caseManagerAgency ? `<p><strong>Agency:</strong> ${body.caseManagerAgency}</p>` : ''}
            ${body.supportNeeds ? `<p><strong>Support Needs:</strong> ${body.supportNeeds}</p>` : ''}
            <p><a href="https://www.elevateforhumanity.org/admin/applications">View in Admin Portal</a></p>
          `,
          }),
        }
      );
    } catch (emailError) {
        logger.error("Unhandled error", emailError instanceof Error ? emailError : undefined);
      }

    return NextResponse.json(
      {
        ok: true,
        id: data.id,
        email: data.email,
        program: data.program_id,
        referenceNumber: referenceNumber,
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
