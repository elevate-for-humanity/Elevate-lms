import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
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
    const { data, error } = await supabase
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message_id: data.id, status: 'queued' });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
