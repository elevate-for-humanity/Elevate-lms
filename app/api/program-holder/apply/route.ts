import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';


import {
  sendProgramHolderApplicationConfirmation,
  sendAdminProgramHolderNotification,
} from '@/lib/email/service';
import { checkRateLimit, verifyTurnstileToken } from '@/lib/turnstile';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const body = await req.json();

    // Rate limiting by email
    if (body.contactEmail) {
      const rateLimit = checkRateLimit(
        `program-holder:${body.contactEmail}`,
        2,
        300000
      ); // 2 per 5 minutes
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
    }

    // Verify Turnstile token (if provided)
    if (body.turnstileToken) {
      const verification = await verifyTurnstileToken(body.turnstileToken);
      if (!verification.success) {
        return NextResponse.json(
          { error: verification.error || 'Verification failed' },
          { status: 400 }
        );
      }
    }

    // Validation
    if (!body.organizationName || !body.contactName || !body.contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!body.programsInterested || body.programsInterested.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one program' },
        { status: 400 }
      );
    }

    // Check for duplicate by email
    const supabase = await getAdminClient();
    // Check for duplicate by email
    const { data: existing } = await supabase
      .from('applications')
      .select('id, status')
      .eq('email', body.contactEmail.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error:
            'An application with this email is already pending review. Please contact us if you need to update your application.',
        },
        { status: 400 }
      );
    }

    // Insert into canonical applications table
    const { data: application, error: insertError } = await supabase
      .from('applications')
      .insert({
        first_name: body.contactName?.split(' ')[0] || body.contactName,
        last_name: body.contactName?.split(' ').slice(1).join(' ') || '',
        email: body.contactEmail.toLowerCase(),
        phone: body.contactPhone || null,
        program_id: 'program_holder',
        status: 'pending',
        notes: JSON.stringify({
          type: 'program_holder',
          organization_name: body.organizationName,
          organization_type: body.organizationType || 'other',
          address: body.address,
          city: body.city,
          state: body.state || 'IN',
          zip: body.zip,
          programs_interested: body.programsInterested,
          estimated_students: body.estimatedStudents,
          how_heard_about_us: body.howHeardAboutUs,
          additional_info: body.additionalInfo,
        }),
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      );
    }

    // Send confirmation email to applicant (non-blocking)
    sendProgramHolderApplicationConfirmation(
      body.contactEmail,
      body.organizationName
    ).catch((err) => {
      // Email error - non-blocking
    });

    // Send notification to admin (non-blocking)
    sendAdminProgramHolderNotification(
      body.organizationName,
      body.contactEmail,
      application.id
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      applicationId: application.id,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/program-holder/apply', _POST);
