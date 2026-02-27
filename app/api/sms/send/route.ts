import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { phone_number, message_text, template_id } = await request.json();

    if (!phone_number || !message_text) {
      return NextResponse.json({ error: 'phone_number and message_text are required' }, { status: 400 });
    }

    // Log the SMS message (actual sending requires Twilio/SMS provider integration)
    const { data, error } = await db
      .from('sms_messages')
      .insert({
        phone_number,
        message_text,
        template_id: template_id || null,
        status: 'queued',
        sent_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message_id: data.id, status: 'queued' });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
export const POST = withApiAudit('/api/sms/send', _POST);
