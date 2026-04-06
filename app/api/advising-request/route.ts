
import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { sendEmail } from '@/lib/email/sendgrid';
import { requireDbWrite, success, failure } from '@/lib/api/safe-handler';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: Request) {
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

    // DB write is required — no fallthrough on failure
    const record = await requireDbWrite(
      supabase.from('advising_requests').insert({
        name,
        phone,
        email,
        program_interest: programInterest,
        contact_methods: contactMethod,
        questions,
        created_at: new Date().toISOString(),
      }).select().single(),
      'Failed to save advising request'
    );

    // Email is secondary — only runs after DB success
    try {
      await sendEmail({
        to: 'elevate4humanityedu@gmail.com',
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
      });

      // SMS alert via AT&T email-to-SMS gateway (only if configured)
      if (process.env.ADMIN_SMS_GATEWAY) {
        await sendEmail({
          to: process.env.ADMIN_SMS_GATEWAY,
          subject: 'Advising',
          html: `${name}\n${phone}\n${programInterest || 'General'}`,
        }).catch((err) => logger.warn('[advising-request] SMS alert failed:', err));
      }
    } catch (emailError) {
      logger.warn('[advising-request] Email failed (record saved):', emailError);
    }

    return success({ id: record.id });
  } catch (err: unknown) {
    const message = 'Failed to process request';
    logger.error('Advising request error:', err);
    return failure(message);
  }
}
export const POST = withApiAudit('/api/advising-request', _POST);
