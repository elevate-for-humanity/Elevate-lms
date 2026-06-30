/**
 * API Route: Send Conference Submission Email
 * 
 * POST /api/email/conference-submission
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendConferenceSubmission } from '@/lib/email/send-conference-submission';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address required' },
        { status: 400 }
      );
    }

    // Check if SENDGRID_API_KEY is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.info('SendGrid not configured. Would send to:', email);
      return NextResponse.json({
        success: true,
        message: 'Email would be sent (SendGrid not configured in development)',
        email,
        preview: 'Check server logs for email content'
      });
    }

    const sent = await sendConferenceSubmission(email);

    if (sent) {
      return NextResponse.json({
        success: true,
        message: 'Conference submission package sent successfully',
        email
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}