import { NextRequest, NextResponse } from 'next/server';

// Using Node.js runtime for email compatibility
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { contactId, email, name, interest, subject, body: emailBody } = body;

    if (!email || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Email, subject, and body are required' },
        { status: 400 }
      );
    }

    // Send email using the existing email utility
    await sendEmail({
      to: email,
      subject: subject,
      html: emailBody.replace(/\n/g, '<br>'),
    });

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    });
  } catch (err: any) {
    logger.error(
      'Error sending welcome email:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/marketing/send-welcome', _POST);
