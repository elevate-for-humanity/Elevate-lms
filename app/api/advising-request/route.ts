export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { sendEmail } from '@/lib/email/sendgrid';

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
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Store in database (you may need to create this table)
    const { error: dbError } = await db
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

    try {
      await sendEmail({
        to: 'admin@elevateforhumanity.org',
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
      logger.error('[advising-request] Email failed:', emailError);
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
export const POST = withApiAudit('/api/advising-request', _POST);
