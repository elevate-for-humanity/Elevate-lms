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
  for (const job of jobs || []) {
    const claimed = await db.from('billing_fulfillment_jobs').update({ status: 'processing', attempts: job.attempts + 1, updated_at: new Date().toISOString() }).eq('id', job.id).in('status', ['pending','failed']).select('id').maybeSingle();
    if (!claimed.data) continue;
    try {
      await fulfillPaidBillingInvoice(db, job);
      await db.from('billing_fulfillment_jobs').update({ status: 'completed', last_error: null, updated_at: new Date().toISOString() }).eq('id', job.id);
      completed += 1;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      logger.error('[billing-fulfillment] job failed', cause, { jobId: job.id, type: job.fulfillment_type });
      await db.from('billing_fulfillment_jobs').update({ status: 'failed', last_error: message.slice(0, 1000), updated_at: new Date().toISOString() }).eq('id', job.id);
    }
  }
  return NextResponse.json({ ok: completed === (jobs || []).length, processed: (jobs || []).length, completed });
}
