import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  readServiceBilling,
  saveServiceBilling,
  refreshServiceBillingAlerts,
} from '@/lib/admin/service-billing';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  try {
    return NextResponse.json(
      { records: await readServiceBilling(await requireAdminClient()) },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: 'Billing records are unavailable. Check provider billing directly.' },
      { status: 503, headers },
    );
  }
}
export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  // Cookie-authenticated updates must originate at this Admin origin.
  if (req.headers.get('origin') !== req.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403, headers });
  try {
    if (Number(req.headers.get('content-length') || 0) > 4096)
      return NextResponse.json({ error: 'Record too large' }, { status: 413, headers });
    const raw = await req.text();
    if (Buffer.byteLength(raw, 'utf8') > 4096)
      return NextResponse.json({ error: 'Record too large' }, { status: 413, headers });
    const body = JSON.parse(raw);
    const db = await requireAdminClient();
    let record = await saveServiceBilling(db, body.record, body.expectedRevision);
    // Save is durable even if a notification provider is unavailable.
    let alertsAvailable = true;
    try {
      await refreshServiceBillingAlerts(db);
    } catch {
      alertsAvailable = false;
    }
    let refreshRequired = false;
    try {
      record =
        (await readServiceBilling(db)).find((r) => r.serviceId === record.serviceId) || record;
    } catch {
      refreshRequired = true;
    }
    return NextResponse.json({ record, alertsAvailable, refreshRequired }, { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status =
      code === 'SERVICE_BILLING_INVALID' || error instanceof SyntaxError
        ? 400
        : code === 'SERVICE_BILLING_CONFLICT'
          ? 409
          : 503;
    return NextResponse.json(
      {
        error:
          status === 409
            ? 'A newer billing record exists. Refresh before saving.'
            : status === 400
              ? 'Check the billing values, dates and reference.'
              : 'Billing record could not be saved.',
      },
      { status, headers },
    );
  }
}
