// PUBLIC ROUTE: SupersonicFastCash careers application
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { name, email, phone, position, experience, message } = body;

    // Validate required fields
    if (!name || !email || !phone || !position) {
      return NextResponse.json(
        { error: 'Name, email, phone, and position are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Save to applications table
    const { data, error } = await supabase
      .from('applications')
      .insert({
        full_name: name,
        email,
        phone,
        status: 'pending',
        source: 'supersonic-fast-cash',
        program_interest: position,
        notes: message || null,
        eligibility_data: {
          type: 'supersonic_career',
          experience,
        },
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save career application:', error);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Send notification email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'Supersonicfastcashllc@gmail.com',
          subject: `New Career Application: ${position}`,
          html: `
            <h2>New Career Application</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Position:</strong> ${position}</p>
            <p><strong>Experience:</strong> ${experience || 'Not specified'}</p>
            <p><strong>Message:</strong> ${message || 'None'}</p>
          `,
        }),
      });
    } catch (emailError) {
      logger.error('Failed to send notification email:', emailError);
    }

    return NextResponse.json({
      success: true,
      applicationId: data.id,
      message: 'Application submitted successfully! We will contact you within 48 hours.',
    });
  } catch (error) {
    logger.error('Career application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/supersonic-fast-cash/careers/apply', _POST);
