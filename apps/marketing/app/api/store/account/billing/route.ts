import { NextRequest, NextResponse } from 'next/server';
import { apiRequireRoles } from '@/lib/admin/guards';
import { ALL_AUTHENTICATED_ROLES } from '@/lib/rbac/role-matrix';
import { requireAdminClient } from '@/lib/supabase/admin';
import { storeBillingKeys } from '@/lib/store/customer-billing';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireRoles(request, ALL_AUTHENTICATED_ROLES);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => null);
  if (
    typeof body?.scheduleId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.scheduleId)
  )
    return NextResponse.json({ error: 'A valid schedule is required.' }, { status: 400 });
  try {
    const db = await requireAdminClient();
    const keys = await storeBillingKeys(db, auth.id);
    const saved = await db
      .from('billing_schedules')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('id', body.scheduleId)
      .eq('provider', 'quickbooks')
      .eq('collection_mode', 'manual_invoice')
      .in('customer_external_key', keys)
      .in('fulfillment_type', ['platform_subscription', 'individual_app_subscription'])
      .in('status', ['active', 'paused', 'canceled'])
      .select('id')
      .maybeSingle();
    if (saved.error) throw saved.error;
    if (!saved.data)
      return NextResponse.json({ error: 'Invoice schedule not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'The invoice schedule could not be updated. Please retry.' },
      { status: 503 },
    );
  }
}
