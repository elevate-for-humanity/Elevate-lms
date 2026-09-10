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
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();
  if (!staffUser?.id || !['staff', 'admin', 'super_admin'].includes(staffUser.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const payload = {
    company_name: clean(body.orgName, 200),
    address: clean(body.address, 300),
    city: clean(body.city, 120),
    state: clean(body.state, 80),
    full_name: clean(body.contactName, 160),
    email: clean(body.contactEmail, 254),
    phone: clean(body.contactPhone, 60),
    notification_preferences: {
      email: Boolean(body.emailNotifications),
      weekly_digest: Boolean(body.weeklyDigest),
      outcome_alerts: Boolean(body.outcomeAlerts),
      referral_confirmations: Boolean(body.referralConfirmations),
    },
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', staffUser.id)
    .select('id, company_name, address, city, state, full_name, email, phone, notification_preferences')
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Failed to save staff settings' }, { status: 500 });
  return NextResponse.json({ success: true, staff: data });
}

export const PUT = withApiAudit('/api/staff/settings', _PUT);
