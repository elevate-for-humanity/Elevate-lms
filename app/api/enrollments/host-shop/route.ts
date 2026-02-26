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
    if (!intake.shopName || !intake.ownerName || !intake.email || !intake.licenseNumber) {
      return NextResponse.json(
        { error: 'Shop name, owner name, email, and license number are required' },
        { status: 400 }
      );
    }

    // Validate agreement acceptance
    if (!agreement.acceptedName || !agreement.acceptedShopName || !agreement.acceptedEmail) {
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

    // Insert host shop application
    const { data: application, error: appError } = await supabase
      .from('host_shop_applications')
      .insert({
        shop_name: intake.shopName,
        owner_name: intake.ownerName,
        email: intake.email.toLowerCase(),
        phone: intake.phone || null,
        address: `${intake.address}, ${intake.city}, ${intake.state} ${intake.zip}`,
        license_info: {
          licenseNumber: intake.licenseNumber,
          licenseExpiration: intake.licenseExpiration,
          supervisorName: intake.supervisorName,
          supervisorLicenseNumber: intake.supervisorLicenseNumber,
        },
        intake: intake,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appError) {
      logger.error('Error inserting host shop application:', appError);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Insert agreement acceptance
    const { error: agreementError } = await supabase
      .from('agreement_acceptances')
      .insert({
        subject_type: 'host_shop',
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
            to: 'elevate4humanityedu@gmail.com',
            subject: `New Host Shop Application: ${intake.shopName}`,
            html: `
              <h2>New Host Barbershop Application</h2>
              <p><strong>Shop Name:</strong> ${intake.shopName}</p>
              <p><strong>Owner:</strong> ${intake.ownerName}</p>
              <p><strong>Email:</strong> ${intake.email}</p>
              <p><strong>Phone:</strong> ${intake.phone || 'Not provided'}</p>
              <p><strong>Address:</strong> ${intake.address}, ${intake.city}, ${intake.state} ${intake.zip}</p>
              <p><strong>License #:</strong> ${intake.licenseNumber}</p>
              <p><strong>Agreement Signed:</strong> Yes (${agreement.key})</p>
              <p><a href="https://www.elevateforhumanity.org/portal/admin/host-shops">View in Admin Portal</a></p>
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
    logger.error('Host shop enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
