// PUBLIC ROUTE: employer onboarding step update
import { NextResponse } from 'next/server';

import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getTemplate } from '@/lib/notifications/templates';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

async function _PATCH(req: Request, { params }: { params: Params }) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Get current record before update (need contact info for email)
    const { data: current } = await supabase
      .from('employer_onboarding')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error }: any = await supabase
      .from('employer_onboarding')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    // Send decision email to employer when status changes to approved or rejected
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    if (current?.contact_email && (status === 'approved' || status === 'rejected')) {
      try {
        const template = getTemplate('employer_decision', {
          approved: status === 'approved',
          contact_name: current.contact_name,
          business_name: current.business_name,
          reason: notes,
          onboarding_url: `${siteUrl}/onboarding/employer`,
        });
        await fetch(`${siteUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: current.contact_email,
            subject: template.subject,
            html: template.html,
          }),
        });
      } catch (err) {
        logger.error('Failed to send employer decision email', err instanceof Error ? err : undefined);
      }
    }

    return NextResponse.json({ success: true, onboarding: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const PATCH = withApiAudit('/api/employers/onboard/[id]', _PATCH);
