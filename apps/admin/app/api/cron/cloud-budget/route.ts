import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/server/cron-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { refreshCloudBudget } from '@/lib/gcp/cloud-budget';
import { refreshServiceBillingAlerts } from '@/lib/admin/service-billing';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = await requireAdminClient();
    // A Google identity/report failure must not suppress other service-bill alerts.
    const [cloud, services] = await Promise.allSettled([
      refreshCloudBudget(db),
      refreshServiceBillingAlerts(db),
    ]);
    if (cloud.status === 'rejected') throw cloud.reason;
    if (services.status === 'rejected')
      return NextResponse.json(
        { error: 'SERVICE_BILLING_ALERTS_UNAVAILABLE', cloudChecked: true },
        { status: 503 },
      );
    return NextResponse.json({ checked: true, serviceAlerts: services.value });
  } catch (error) {
    // Emit only our error code, never provider payloads or identity tokens.
    const code =
      error instanceof Error && /^CLOUD_BUDGET_[A-Z_0-9]+$/.test(error.message)
        ? error.message
        : 'CLOUD_BUDGET_UNAVAILABLE';
    return NextResponse.json({ error: code }, { status: 503 });
  }
}
