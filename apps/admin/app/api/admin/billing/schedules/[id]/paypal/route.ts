import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { provisionPayPalSubscription } from '@/lib/billing/providers/paypal-subscriptions';
import { safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request, 'payment');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  const db = await requireAdminClient();
  const schedule = await db.from('billing_schedules').select('*').eq('id', id).maybeSingle();
  if (schedule.error || !schedule.data) {
    return NextResponse.json({ error: 'Billing schedule not found.' }, { status: 404 });
  }
  if (schedule.data.collection_mode !== 'automatic' || schedule.data.collection_provider !== 'paypal') {
    return NextResponse.json({ error: 'This schedule is not configured for PayPal automatic collection.' }, { status: 409 });
  }
  const authorization = await db
    .from('billing_migration_authorizations')
    .select('id')
    .eq('billing_schedule_id', id)
    .eq('authorization_scope', 'recurring_tuition')
    .eq('status', 'approved')
    .maybeSingle();
  if (authorization.error || !authorization.data) {
    return NextResponse.json({ error: 'Approve the signed recurring-payment release before creating the PayPal subscription.' }, { status: 409 });
  }
  try {
    const result = await provisionPayPalSubscription(db, schedule.data);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'PayPal subscription setup failed');
  }
}
