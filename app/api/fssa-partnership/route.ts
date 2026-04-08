import { NextRequest, NextResponse } from 'next/server';

// Using Node.js runtime for email compatibility
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { hydrateProcessEnv } from '@/lib/secrets';

export const maxDuration = 60;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    await hydrateProcessEnv();
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const data = await parseBody<Record<string, any>>(request);
    const supabase = await createClient();

    // Store in snap_outreach_log
    const { error: logError } = await supabase.from('snap_outreach_log').insert({
      recipient_email: data.email,
      recipient_org: data.organization,
      recipient_name: data.name,
      message_type: 'partnership_request',
      status: 'received',
      sent_at: new Date().toISOString(),
    });

    if (logError) {
      /* Log error handled silently */
    }

    // Send notification to admin
    try {
      await resend.emails.send({
        from: 'FSSA Partnership <noreply@elevateforhumanity.org>',
        to: 'elevate4humanityedu@gmail.com',
        subject: `🎯 FSSA Partnership Request: ${data.organization}`,
        html: `
          <h2>New FSSA/WorkOne Partnership Request</h2>

          <h3>Contact Information:</h3>
          <ul>
            <li><strong>Name:</strong> ${data.name}</li>
            <li><strong>Organization:</strong> ${data.organization}</li>
            <li><strong>Title:</strong> ${data.title || 'Not provided'}</li>
            <li><strong>Email:</strong> ${data.email}</li>
            <li><strong>Phone:</strong> ${data.phone || 'Not provided'}</li>
          </ul>

          <h3>Partnership Interest:</h3>
          <p><strong>Type:</strong> ${data.partnershipType}</p>
          <p><strong>Programs of Interest:</strong> ${data.programsInterest || 'Not specified'}</p>

          <h3>Message:</h3>
          <p>${data.message || 'No additional message'}</p>

          <hr>
          <p><small>Submitted: ${new Date().toLocaleString()}</small></p>
          <p><small>Logged in snap_outreach_log table</small></p>
        `,
      });

      // Send auto-reply to requester
      await resend.emails.send({
        from: 'Elevate for Humanity <partnerships@elevateforhumanity.org>',
        to: data.email,
        subject: 'Thank you for your FSSA/SNAP E&T partnership inquiry',
        html: `
          <p>Dear ${data.name},</p>

          <p>Thank you for your interest in partnering with Elevate for Humanity Technical & Career Institute for SNAP E&T services.</p>

          <p>We have received your partnership request and our team will review it promptly. We typically respond within 1-2 business days.</p>

          <h3>What's Next:</h3>
          <ul>
            <li>Our partnerships team will review your request</li>
            <li>We'll schedule a discovery call to discuss your needs</li>
            <li>We'll provide detailed information about our SNAP E&T capabilities</li>
            <li>We'll explore how we can support your participants</li>
          </ul>

          <h3>Our SNAP E&T Capabilities:</h3>
          <ul>
            <li>✅ ETPL-approved training provider</li>
            <li>✅ DOL Registered Apprenticeship Sponsor (Barber program)</li>
            <li>✅ 80-hour compliance tracking system</li>
            <li>✅ Automated FSSA reporting</li>
            <li>✅ Multiple credentialed pathways</li>
            <li>✅ Job placement support</li>
          </ul>

          <p><strong>Contact Information:</strong><br>
          Phone: 317-314-3757<br>
          Email: partnerships@elevateforhumanity.org<br>
          Address: 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</p>

          <p>We look forward to discussing how we can partner to serve SNAP recipients in Indiana.</p>

          <p>Best regards,<br>
          <strong>Elizabeth Greene</strong><br>
          Founder & CEO<br>
          Elevate for Humanity Technical & Career Institute</p>
        `,
      });
    } catch (emailError) {
        logger.error("Unhandled error", emailError instanceof Error ? emailError : undefined);
      }

    return NextResponse.json({
      success: true,
      message: 'Partnership request received. We will contact you within 1-2 business days.'
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Failed to process partnership request' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/fssa-partnership', _POST);
