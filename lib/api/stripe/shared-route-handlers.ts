import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

async function retiredAdminAction(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return NextResponse.json({
    error: 'This merchant setup or invoice creation endpoint is retired. Use an approved offer and the current billing flow.',
  }, { status: 410 });
}

async function retiredSellerAction(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    error: 'Separate merchant onboarding is retired. Elevate billing manages approved invoices and payment agreements.',
  }, { status: 410 });
}

async function listCurrentInvoices(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('billing_invoices')
    .select('id,provider,provider_invoice_id,invoice_number,customer_email,total_cents,currency,status,due_at,paid_at,payment_url,created_at')
    .eq('provider', 'quickbooks')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'Billing ledger unavailable' }, { status: 503 });
  return NextResponse.json({ invoices: data ?? [], provider: 'quickbooks', limit: 100 });
}

export const postConnectCreate = withRuntime(withApiAudit('/api/stripe/connect/create', retiredAdminAction));
export const postConnectOnboard = withRuntime(withApiAudit('/api/stripe/connect/onboard', retiredSellerAction));
export const getInvoices = withRuntime(withApiAudit('/api/stripe/invoice/create', listCurrentInvoices));
export const postInvoice = withRuntime(withApiAudit('/api/stripe/invoice/create', retiredAdminAction));
