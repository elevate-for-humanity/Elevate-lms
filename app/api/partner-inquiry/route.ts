
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const data = await parseBody<Record<string, any>>(request);
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Store in database
    const { error: dbError } = await db.from('partner_inquiries').insert({
      full_name: data.fullName,
      organization: data.organization,
      email: data.email,
      phone: data.phone,
      relationship_type: data.relationshipType,
      resources: data.resources,
      seeking: data.seeking,
      written_agreement: data.writtenAgreement,
      additional_info: data.additionalInfo,
      ip_acknowledged: true,
      submitted_at: new Date().toISOString(),
    });

    if (dbError) {
      // Error: $1
      // Continue even if DB fails - we'll send email
    }

    // Send notification email
    try {
      await sendEmail({
        to: process.env.NOTIFY_EMAIL_TO || 'admin@elevateforhumanity.org',
        subject: `New Partner Inquiry: ${data.fullName} (${data.relationshipType})`,
        html:
          `<p><strong>Name:</strong> ${data.fullName}<br>` +
          `<strong>Org:</strong> ${data.organization || '-'}<br>` +
          `<strong>Email:</strong> ${data.email}<br>` +
          `<strong>Phone:</strong> ${data.phone || '-'}<br>` +
          `<strong>Relationship:</strong> ${data.relationshipType}</p>` +
          `<p><strong>Value:</strong><br>${data.resources}</p>` +
          `<p><strong>Seeking:</strong> ${data.seeking}<br>` +
          `<strong>Agreement Ack:</strong> ${data.writtenAgreement}</p>` +
          `<p><strong>Additional Info:</strong><br>${data.additionalInfo || '-'}</p>`,
      });

      // SMS alert via AT&T email-to-SMS gateway (only if configured)
      if (process.env.ADMIN_SMS_GATEWAY) {
        await sendEmail({
          to: process.env.ADMIN_SMS_GATEWAY,
          subject: 'Partner',
          html: `${data.fullName}\n${data.organization || ''}\n${data.relationshipType}`,
        }).catch((err) => logger.warn('[partner-inquiry] SMS alert failed:', err));
      }

      // Auto-reply to submitter
      await sendEmail({
        to: data.email,
        subject: 'We received your partner inquiry | Elevate for Humanity',
        html:
          `<p>Thank you for your inquiry.</p>` +
          `<p>We review requests through our structured process to protect participants and platform integrity. ` +
          `If there is alignment, our team will follow up with next steps.</p>` +
          `<p>— Elevate for Humanity</p>`,
      });
    } catch (emailError) {
      logger.error('[partner-inquiry] Email failed:', emailError instanceof Error ? emailError : undefined);
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    // Error: $1
    return NextResponse.json(
      { error: 'Failed to process inquiry' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/partner-inquiry', _POST);
