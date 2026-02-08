export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      program_holder_id,
      email_enabled,
      sms_enabled,
      phone_e164,
      sms_consent,
    } = body;

    // Verify user owns this program holder
    const { data: programHolder } = await supabase
      .from('program_holders')
      .select('id')
      .eq('id', program_holder_id)
      .eq('user_id', user.id)
      .single();

    if (!programHolder) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update or insert preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          program_holder_id,
          email_enabled: email_enabled !== false,
          sms_enabled: sms_enabled === true,
          phone_e164: phone_e164 || null,
          sms_consent: sms_consent === true,
          sms_consent_at:
            sms_consent === true ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'program_holder_id' }
      )
      .select()
      .single();

    if (error) {
      logger.error('[Notification Preferences] Update failed', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    logger.info('[Notification Preferences] Updated', {
      programHolderId: program_holder_id,
      emailEnabled: email_enabled,
      smsEnabled: sms_enabled,
    });

    return NextResponse.json({ success: true, preferences });
  } catch (error) { /* Error handled silently */ 
    logger.error('[Notification Preferences] Error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
