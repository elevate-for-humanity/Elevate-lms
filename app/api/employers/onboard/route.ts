import { NextResponse } from 'next/server';

import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getTemplate } from '@/lib/notifications/templates';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      employer_id,
      documents,
      business_name,
      contact_name,
      contact_email,
      contact_phone,
    } = body;

    const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    const { data, error }: any = await supabase
      .from('employer_onboarding')
      .insert([
        {
          employer_id,
          business_name,
          contact_name,
          contact_email,
          contact_phone,
          documents,
          status: 'pending_review',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    // Send welcome email to employer
    try {
      const template = getTemplate('employer_application_received', {
        contact_name,
        business_name,
      });
      await fetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact_email,
          subject: template.subject,
          html: template.html,
        }),
      });
    } catch (err) {
      logger.error('Failed to send employer welcome email', err instanceof Error ? err : undefined);
    }

    // Send notification email to admin
    try {
      await fetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'elevate4humanityedu@gmail.com',
          subject: `New Employer Application: ${business_name}`,
          html: `
            <h2>New Employer Application</h2>
            <p><strong>Business Name:</strong> ${business_name}</p>
            <p><strong>Contact:</strong> ${contact_name}</p>
            <p><strong>Email:</strong> ${contact_email}</p>
            <p><strong>Phone:</strong> ${contact_phone}</p>
            <p><strong>Status:</strong> Pending Review</p>
            <p><a href="${siteUrl}/admin/employers/onboarding">Review Application</a></p>
          `,
        }),
      });
    } catch (err) {
      logger.error('Failed to send admin notification', err instanceof Error ? err : undefined);
    }

    return NextResponse.json({ success: true, onboarding: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await getAdminClient();

    const { data, error }: any = await supabase
      .from('employer_onboarding')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ onboardings: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/employers/onboard', _GET);
export const POST = withApiAudit('/api/employers/onboard', _POST);
