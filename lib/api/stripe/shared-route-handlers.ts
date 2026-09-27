import { z } from 'zod';
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';

const invoiceSchema = z.object({
  employer_id: z.string().uuid(),
  customerId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerName: z.string().min(1).optional(),
});

async function providerAccountCompatibility(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    provider: 'quickbooks',
    collectionProvider: 'paypal',
    message: 'Provider account onboarding is managed by Elevate billing settings.',
    destination: '/settings/payments',
  });
}

async function createInvoice(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const parsed = invoiceSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid invoice request' }, { status: 400 });
  const allowed = ['admin', 'platform', 'compliance', 'coordination', 'supervision'];
  if (!allowed.some((word) => parsed.data.description.toLowerCase().includes(word))) {
    return NextResponse.json({ error: 'Invalid invoice description. Only admin/platform/compliance fees allowed.' }, { status: 400 });
  }
  const db = await requireAdminClient();
  const provider = createQuickBooksBillingProvider(db);
  const result = await provider.createManualInvoice({
    idempotencyKey: `compat-invoice:${parsed.data.employer_id}:${parsed.data.customerId}:${Math.round(parsed.data.amount * 100)}:${parsed.data.description}`,
    customer: {
      externalKey: parsed.data.customerId,
      email: parsed.data.customerEmail || `${parsed.data.customerId}@billing.elevate.invalid`,
      displayName: parsed.data.customerName || parsed.data.customerId,
    },
    lines: [{
      canonicalKey: 'platform-service',
      name: parsed.data.description,
      description: parsed.data.description,
      quantity: 1,
      unitAmountCents: Math.round(parsed.data.amount * 100),
    }],
    memo: parsed.data.description,
  });
  return NextResponse.json({ provider: 'quickbooks', invoice: result });
}

async function listInvoices(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const db = await requireAdminClient();
  const { data, error } = await db.from('billing_invoices').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  return NextResponse.json({ provider: 'quickbooks', invoices: data ?? [] });
}

export const postConnectCreate = withRuntime(withApiAudit('/api/payments/provider-account/create', providerAccountCompatibility));
export const postConnectOnboard = withRuntime(withApiAudit('/api/payments/provider-account/onboard', providerAccountCompatibility));
export const getInvoices = withRuntime(withApiAudit('/api/billing/invoice/create', listInvoices));
export const postInvoice = withRuntime(withApiAudit('/api/billing/invoice/create', createInvoice));
