import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await request.formData();
  const values: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };
  for (const key of [
    'email_course_updates',
    'email_grades',
    'email_deadlines',
    'email_messages',
    'email_newsletter',
    'push_messages',
    'push_reminders',
    'push_announcements',
    'sms_urgent',
    'sms_reminders',
    'in_app_all',
    'in_app_sound',
  ])
    values[key] = form.get(key) === 'on';
  const phone = String(form.get('sms_phone') || '').trim();
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone))
    return NextResponse.json(
      { error: 'Use an international phone number such as +13175551234' },
      { status: 400 },
    );
  values.sms_phone = phone;
  const { error } = await db
    .from('notification_preferences')
    .upsert(values, { onConflict: 'user_id' });
  if (error)
    return NextResponse.json(
      { error: 'Notification preferences could not be saved' },
      { status: 503 },
    );
  return NextResponse.redirect(
    new URL('/account/settings/notifications?saved=1', request.url),
    303,
  );
}
