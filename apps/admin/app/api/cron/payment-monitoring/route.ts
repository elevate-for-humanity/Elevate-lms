import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Provider-confirmed PayPal/QuickBooks webhooks own payment state. This cron
// reports ledger exceptions without inferring a failed payment from a due date
// or sending repeat reminders on every run.
async function _GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await requireAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [schedules, invoices] = await Promise.all([
    db.from('billing_schedules')
      .select('id,status,collection_mode,provider_status,next_invoice_date')
      .eq('provider', 'quickbooks').in('status', ['active', 'paused']).limit(1000),
    db.from('billing_invoices')
      .select('id,status,due_at')
      .eq('provider', 'quickbooks').in('status', ['open', 'past_due']).limit(1000),
  ]);
  if (schedules.error || invoices.error) {
    return NextResponse.json({ error: 'Billing ledger unavailable.' }, { status: 503 });
  }

  const scheduleRows = schedules.data || [];
  const invoiceRows = invoices.data || [];
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results: {
      activeSchedules: scheduleRows.filter((row: any) => row.status === 'active').length,
      awaitingPayPalAuthorization: scheduleRows.filter((row: any) =>
        row.collection_mode === 'automatic' && row.provider_status !== 'active').length,
      upcomingManualInvoices: scheduleRows.filter((row: any) =>
        row.status === 'active' && row.collection_mode === 'manual_invoice' &&
        row.next_invoice_date >= today && row.next_invoice_date <= inTwoDays).length,
      pastDueInvoices: invoiceRows.filter((row: any) => row.status === 'past_due' ||
        (row.status === 'open' && row.due_at && row.due_at < today)).length,
      truncated: scheduleRows.length === 1000 || invoiceRows.length === 1000,
    },
  });
}

export const GET = withRuntime(withApiAudit('/api/cron/payment-monitoring', _GET, { actor_type: 'cron' }));
