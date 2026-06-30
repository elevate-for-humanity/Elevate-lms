import { internalFetch } from '@/lib/api/internal-fetch';
import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { reason } = await request.json();
    const supabase = await requireAdminClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    // Get the application
    const { data: application, error: fetchError } = await supabase
      .from('partner_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !application) {
      return NextResponse.json({ error: 'No matching application was found.' }, { status: 404 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ error: 'Application already processed' }, { status: 400 });
    }

    // Update application status
    await supabase
      .from('partner_applications')
      .update({
        status: 'denied',
        status_reason: reason,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Send denial email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
    try {
      await internalFetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: application.contact_email,
          subject: 'Partner Application Update - ${PLATFORM_DEFAULTS.orgName}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e3a8a;">Partner Application Update</h2>
              <p>Hi ${application.owner_name},</p>
              <p>Thank you for your interest in becoming a Partner Shop with ${PLATFORM_DEFAULTS.orgName}.</p>
              <p>After reviewing your application for <strong>${application.shop_name}</strong>, we are unable to approve it at this time.</p>
              
              ${
                reason
                  ? `
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
              </div>
              `
                  : ''
              }
              
              <p>If you believe this decision was made in error or if your circumstances have changed, please feel free to:</p>
              <ul>
                <li>Contact us at <a href="tel:${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a></li>
                <li>Reply to this email with additional information</li>
                <li>Reapply after addressing the concerns mentioned above</li>
              </ul>
              
              <p>We appreciate your interest in supporting workforce development.</p>
              
              <p>Best regards,<br><strong>${PLATFORM_DEFAULTS.orgName} Team</strong></p>
            </div>
          `,
        }),
      });
    } catch (emailError) {
      logger.warn('Failed to send denial email:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Deny error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/partner/applications/[id]/deny', _POST);
