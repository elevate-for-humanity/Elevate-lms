import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const {
      organizationName,
      contactName,
      title,
      email,
      phone,
      organizationType,
      estimatedUsers,
      timeline,
      useCase,
      technicalCapability,
      message,
      licenseType,
    } = body;

    // Validate required fields
    if (!organizationName || !contactName || !email || !organizationType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store the license request
    const { error: dbError } = await supabase
      .from('license_requests')
      .insert({
        organization_name: organizationName,
        contact_name: contactName,
        title: title || null,
        email,
        phone: phone || null,
        organization_type: organizationType,
        estimated_users: estimatedUsers || null,
        timeline: timeline || null,
        use_case: useCase || null,
        technical_capability: technicalCapability || null,
        message: message || null,
        license_type: licenseType || 'managed',
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      logger.error('Database error:', dbError);
      // Continue even if DB fails - we'll send email notification
    }

    // Send email notification
    const emailBody = `
New License Request

License Type: ${licenseType === 'source_use' ? 'Restricted Source-Use License (Enterprise)' : 'Managed Enterprise LMS'}

Organization: ${organizationName}
Contact: ${contactName}${title ? ` (${title})` : ''}
Email: ${email}
Phone: ${phone || 'Not provided'}
Organization Type: ${organizationType}
${estimatedUsers ? `Estimated Users: ${estimatedUsers}` : ''}
${timeline ? `Timeline: ${timeline}` : ''}
${useCase ? `Use Case: ${useCase}` : ''}
${technicalCapability ? `Technical Capability: ${technicalCapability}` : ''}
${message ? `Additional Info: ${message}` : ''}

---
This request was submitted via the Platform Licensing page.
    `.trim();

    // Send via Resend if configured
    if (process.env.SENDGRID_API_KEY) {
      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: process.env.LICENSE_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com' }] }],
            from: { name: 'Elevate for Humanity', email: 'noreply@elevateforhumanity.org' },
            subject: `[License Request] ${licenseType === 'source_use' ? 'Enterprise Source-Use' : 'Managed LMS'} - ${organizationName}`,
            content: [{ type: 'text/plain', value: emailBody }],
          }),
        });
      } catch (emailError) {
        logger.error('Email error:', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('License request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withRuntime(withApiAudit('/api/licenses/request', _POST));
