import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'payment');
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const enforcementId = typeof body.enforcementId === 'string' ? body.enforcementId : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!enforcementId || !email) return NextResponse.json({ error: 'Enforcement reference and email are required.' }, { status: 400 });

  const db = await requireAdminClient();
  const { data: hold, error } = await db.from('testing_enforcement')
    .select('id,email,enforcement_type,fee_cents,fee_paid')
    .eq('id', enforcementId).eq('email', email).maybeSingle();
  if (error || !hold) return NextResponse.json({ error: 'Testing hold not found.' }, { status: 404 });
  if (hold.fee_paid) return NextResponse.json({ error: 'This testing hold is already paid.' }, { status: 409 });
  const amountCents = Number(hold.fee_cents || 0);
  if (amountCents <= 0) return NextResponse.json({ error: 'This hold does not have a payable fee.' }, { status: 422 });

  const invoice = await createQuickBooksBillingProvider(db).createManualInvoice({
    idempotencyKey: `testing-enforcement:${hold.id}`,
    customer: { externalKey: `email:${email}`, displayName: email, email },
    lines: [{ canonicalKey: `testing-enforcement-${hold.enforcement_type}`, name: 'Testing rescheduling / enforcement fee', quantity: 1, unitAmountCents: amountCents }],
    dueDate: new Date().toISOString().slice(0, 10),
    memo: `Testing enforcement ${hold.id}`,
    fulfillment: { type: 'testing_enforcement', payload: { enforcement_id: hold.id, email, amount_cents: amountCents } },
  });
  if (!invoice.paymentUrl) return NextResponse.json({ error: 'Payment link is unavailable.' }, { status: 503 });
  return NextResponse.json({ url: invoice.paymentUrl, invoiceId: invoice.providerInvoiceId });
}
