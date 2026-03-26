import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: campaigns, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, campaigns });
  } catch (error) { 
    logger.error(
      'Error fetching campaigns:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await req.json();

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        name: body.name,
        subject: body.subject,
        from_name: body.fromName,
        from_email: body.fromEmail,
        reply_to: body.replyTo,
        template_key: body.template,
        html_content: body.customHtml,
        recipient_list: body.recipientList,
        status: body.status || 'draft',
        scheduled_for: body.scheduledFor || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, campaign });
  } catch (error) { 
    logger.error(
      'Error creating campaign:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/email/campaigns', _GET);
export const POST = withApiAudit('/api/email/campaigns', _POST);
