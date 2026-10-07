import { NextRequest, NextResponse } from 'next/server';
import { fulfillPaidBillingInvoice } from '@/lib/billing/fulfillment';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await requireAdminClient();
  const { data: jobs, error } = await db.from('billing_fulfillment_jobs').select('id,billing_invoice_id,fulfillment_type,payload,attempts').in('status', ['pending','failed']).lt('attempts', 5).order('created_at').limit(100);
  if (error) return NextResponse.json({ error: 'Could not load billing fulfillment jobs.' }, { status: 500 });
  let completed = 0;
  let failed = 0;
  let skipped = 0;
  for (const job of jobs || []) {
    const claimed = await db.from('billing_fulfillment_jobs').update({ status: 'processing', attempts: job.attempts + 1, updated_at: new Date().toISOString() }).eq('id', job.id).in('status', ['pending','failed']).select('id').maybeSingle();
    if (claimed.error) { failed += 1; continue; }
    if (!claimed.data) { skipped += 1; continue; }
    try {
      const invoice = await db.from('billing_invoices')
        .select('status,fulfillment_type,fulfillment_payload')
        .eq('id', job.billing_invoice_id).maybeSingle();
      if (invoice.error || invoice.data?.status !== 'paid' || invoice.data?.fulfillment_type !== job.fulfillment_type)
        throw new Error('Paid invoice delivery could not be verified.');
      await fulfillPaidBillingInvoice(db, { ...job, payload: invoice.data.fulfillment_payload });
      const saved = await db.from('billing_fulfillment_jobs').update({ status: 'completed', last_error: null, updated_at: new Date().toISOString() }).eq('id', job.id);
      if (saved.error) throw new Error('Delivery completed but its status could not be saved.');
      completed += 1;
    } catch (cause) {
      failed += 1;
      const message = cause instanceof Error ? cause.message : String(cause);
      logger.error('[billing-fulfillment] job failed', cause, { jobId: job.id, type: job.fulfillment_type });
      await db.from('billing_fulfillment_jobs').update({ status: 'failed', last_error: message.slice(0, 1000), updated_at: new Date().toISOString() }).eq('id', job.id);
    }
  }
  return NextResponse.json({ ok: failed === 0, processed: (jobs || []).length, completed, failed, skipped }, { status: failed ? 207 : 200 });
}
