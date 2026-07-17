import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email_enabled, sms_enabled, phone_e164, sms_consent } = body;

    // Update or insert preferences — table uses user_id as the unique key
    const { data: preferences, error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          email_enabled: email_enabled !== false,
          sms_enabled: sms_enabled === true,
          phone_e164: phone_e164 || null,
          sms_consent: sms_consent === true,
          sms_consent_at: sms_consent === true ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .maybeSingle();

    if (error) {
      logger.error('[Notification Preferences] Update failed', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    logger.info('[Notification Preferences] Updated', {
      userId: user.id,
      emailEnabled: email_enabled,
      smsEnabled: sms_enabled,
    });

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    logger.error('[Notification Preferences] Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/program-holder/notification-preferences', _POST);
