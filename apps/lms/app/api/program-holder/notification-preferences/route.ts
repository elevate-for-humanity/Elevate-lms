// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user before this preference write.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const emailAlerts = body.email_alerts === 'true';
  const smsAlerts = body.sms_alerts === 'true';
  const smsPhone = String(body.sms_phone || '').replace(/[^0-9+]/g, '');
  const emailDeliveryUpdates = body.email_delivery_updates === 'true';
  const smsDeliveryUpdates = body.sms_delivery_updates === 'true';
  if ((smsAlerts || smsDeliveryUpdates) && (smsPhone.length < 10 || smsPhone.length > 16)) return NextResponse.json({ error: 'Enter a valid mobile number for text alerts.' }, { status: 400 });
  const { error } = await ctx.db.from('notification_preferences').upsert({
    user_id: ctx.user.id,
    email_course_updates: emailAlerts,
    sms_urgent: smsAlerts,
    email_delivery_updates: emailDeliveryUpdates,
    sms_delivery_updates: smsDeliveryUpdates,
    sms_phone: smsPhone || null,
    opted_in_at: emailAlerts || smsAlerts || emailDeliveryUpdates || smsDeliveryUpdates ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'Notification preferences could not be saved.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
