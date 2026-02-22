export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await parseBody<Record<string, any>>(request);
    const { name, phone, email, programInterest, contactMethod, questions } = body;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store in database (you may need to create this table)
    const { error: dbError } = await supabase
      .from('advising_requests')
      .insert({
        name,
        phone,
        email,
        program_interest: programInterest,
        contact_methods: contactMethod,
        questions,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      logger.error('Database error:', dbError);
      // Continue even if database insert fails - we'll still send the email
    }

    // Send email notification (optional - requires email service setup)
    // You can use Resend, SendGrid, or similar
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Elevate For Humanity <noreply@elevateforhumanity.org>',
          to: 'info@elevateforhumanity.org',
          subject: `New Advising Request from ${name}`,
          html: `
            <h2>New Advising Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Email:</strong> ${email || 'Not provided'}</p>
            <p><strong>Program Interest:</strong> ${programInterest || 'Not specified'}</p>
            <p><strong>Preferred Contact Methods:</strong> ${Array.isArray(contactMethod) ? contactMethod.join(', ') : 'Not specified'}</p>
            <p><strong>Questions/Notes:</strong></p>
            <p>${questions || 'None provided'}</p>
          `,
        }),
      });

      // SMS alert via AT&T gateway
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Elevate <noreply@elevateforhumanity.org>',
          to: process.env.ADMIN_SMS_GATEWAY || '',
          subject: 'Advising',
          text: `${name}\n${phone}\n${programInterest || 'General'}`,
        }),
      });
    } catch (emailError) {
      logger.error('Email error:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error('Error processing advising request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
