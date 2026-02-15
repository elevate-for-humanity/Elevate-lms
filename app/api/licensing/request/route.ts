import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      organization,
      name,
      email,
      phone,
      type,
      students,
      timeline,
      details,
    } = body;

    // Validate required fields
    if (!organization || !name || !email || !type || !students) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store in licensing_requests table (or leads table if it exists)
    const { error: dbError } = await supabase
      .from('leads')
      .insert({
        source: 'platform_licensing',
        organization_name: organization,
        contact_name: name,
        email,
        phone: phone || null,
        metadata: {
          organization_type: type,
          student_volume: students,
          timeline: timeline || null,
          details: details || null,
        },
        status: 'new',
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      logger.error('Failed to save licensing request:', dbError);
      // Don't fail the request - still send notification
    }

    // Send notification email (if Resend is configured)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Elevate Platform <elevate4humanityedu@gmail.com>',
            to: ['elevate4humanityedu@gmail.com', 'elevate4humanityedu@gmail.com'],
            subject: `New Platform Licensing Request: ${organization}`,
            html: `
              <h2>New Licensing Request</h2>
              <p><strong>Organization:</strong> ${organization}</p>
              <p><strong>Contact:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Type:</strong> ${type}</p>
              <p><strong>Student Volume:</strong> ${students}</p>
              <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
              <p><strong>Details:</strong> ${details || 'None provided'}</p>
            `,
          }),
        });
      } catch (emailError) {
        logger.error('Failed to send notification email:', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Licensing request error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
