import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    const { data: campaigns, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, campaigns });
  } catch (error) { /* Error handled silently */ 
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

export async function POST(req: Request) {
  try {
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
  } catch (error) { /* Error handled silently */ 
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
