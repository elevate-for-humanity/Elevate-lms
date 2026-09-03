import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _PUT(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: staffUser } = await supabase
    .from('staff_users')
    .select('staff_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!staffUser?.staff_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const payload = {
    name: clean(body.orgName, 200),
    address: clean(body.address, 300),
    city: clean(body.city, 120),
    state: clean(body.state, 80),
    contact_name: clean(body.contactName, 160),
    contact_email: clean(body.contactEmail, 254),
    contact_phone: clean(body.contactPhone, 60),
    notification_preferences: {
      email: Boolean(body.emailNotifications),
      weekly_digest: Boolean(body.weeklyDigest),
      outcome_alerts: Boolean(body.outcomeAlerts),
      referral_confirmations: Boolean(body.referralConfirmations),
    },
  };

  const { data, error } = await supabase
    .from('staffs')
    .update(payload)
    .eq('id', staffUser.staff_id)
    .select('id, name, address, city, state, contact_name, contact_email, contact_phone, notification_preferences')
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Failed to save staff settings' }, { status: 500 });
  return NextResponse.json({ success: true, staff: data });
}

export const PUT = withApiAudit('/api/staff/settings', _PUT);
