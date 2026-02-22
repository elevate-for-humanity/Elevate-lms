import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { intake, agreement } = body;

    if (!intake || !agreement) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate required intake fields
    if (!intake.fullName || !intake.email || !intake.phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    // Validate agreement acceptance
    if (!agreement.acceptedName || !agreement.acceptedEmail) {
      return NextResponse.json(
        { error: 'Agreement acceptance is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Get client info for audit
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || '';

    // Insert apprentice application
    const { data: application, error: appError } = await db
      .from('apprentice_applications')
      .insert({
        program_slug: 'barber-apprenticeship',
        full_name: intake.fullName,
        email: intake.email.toLowerCase(),
        phone: intake.phone,
        intake: intake,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appError) {
      logger.error('Error inserting apprentice application:', appError);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Insert agreement acceptance
    const { error: agreementError } = await db
      .from('agreement_acceptances')
      .insert({
        subject_type: 'apprentice',
        subject_id: application.id,
        agreement_key: agreement.key,
        agreement_version: agreement.version,
        accepted_name: agreement.acceptedName,
        accepted_email: agreement.acceptedEmail.toLowerCase(),
        accepted_ip: clientIp || null,
        user_agent: userAgent || null,
      });

    if (agreementError) {
      logger.error('Error inserting agreement acceptance:', agreementError);
      // Don't fail the whole request, application is already saved
    }

    // Send notification email (non-blocking)
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/api/email/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'info@elevateforhumanity.org',
            subject: `New Barber Apprentice Application: ${intake.fullName}`,
            html: `
              <h2>New Barber Apprenticeship Application</h2>
              <p><strong>Name:</strong> ${intake.fullName}</p>
              <p><strong>Email:</strong> ${intake.email}</p>
              <p><strong>Phone:</strong> ${intake.phone}</p>
              <p><strong>City:</strong> ${intake.city || 'Not provided'}</p>
              <p><strong>Agreement Signed:</strong> Yes (${agreement.key})</p>
              <p><a href="https://www.elevateforhumanity.org/portal/admin/apprentices">View in Admin Portal</a></p>
            `,
          }),
        }
      );
    } catch (err) {
        logger.error("Unhandled error", err instanceof Error ? err : undefined);
      }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
    });
  } catch (error) {
    logger.error('Apprentice enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
