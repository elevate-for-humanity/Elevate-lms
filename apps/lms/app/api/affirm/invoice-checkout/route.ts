import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { affirm, getAffirmCheckoutConfig } from '@/lib/affirm/client';
import {
  affirmInvoiceOrderId,
  invoiceBelongsToUser,
  isAffirmInvoiceAmount,
} from '@/lib/billing/invoice-checkout';
import { getQuickBooksInvoiceCollectionState } from '@/lib/billing/providers/quickbooks';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({ billingInvoiceId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'payment');
  if (limited) return limited;
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to pay this invoice.' }, { status: 401 });

  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid invoice.' }, { status: 400 });

  const db = await requireAdminClient();
  const [profile, invoice] = await Promise.all([
    db.from('profiles').select('email,full_name').eq('id', user.id).maybeSingle(),
    db
      .from('billing_invoices')
      .select(
        'id,invoice_number,customer_external_key,customer_email,total_cents,currency,status,provider',
      )
      .eq('id', parsed.data.billingInvoiceId)
      .maybeSingle(),
  ]);
  if (profile.error || invoice.error || !profile.data || !invoice.data) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }
  if (!invoiceBelongsToUser(invoice.data, user.id, profile.data.email)) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }
  if (
    invoice.data.provider !== 'quickbooks' ||
    !['open', 'past_due'].includes(invoice.data.status)
  ) {
    return NextResponse.json({ error: 'This invoice is not open for payment.' }, { status: 409 });
  }
  if (invoice.data.currency !== 'USD' || !isAffirmInvoiceAmount(Number(invoice.data.total_cents))) {
    return NextResponse.json(
      { error: 'This invoice is not eligible for Affirm checkout.' },
      { status: 409 },
    );
  }

  try {
    const current = await getQuickBooksInvoiceCollectionState(db, invoice.data.id);
    await hydrateProcessEnv();
    affirm.tryLateConfig();
    if (!affirm.isConfigured()) {
      return NextResponse.json({ error: 'Affirm is not configured.' }, { status: 503 });
    }

    const orderId = affirmInvoiceOrderId(invoice.data.id, current.amountCents);
    const confirmation = new URL('/api/affirm/invoice-capture', request.nextUrl.origin);
    confirmation.searchParams.set('billingInvoiceId', invoice.data.id);
    const cancel = new URL('/account/payment-methods', request.nextUrl.origin);
    cancel.searchParams.set('affirm', 'canceled');
    const checkoutConfig = getAffirmCheckoutConfig({
      amount: current.amountCents,
      orderId,
      programName: `Invoice ${invoice.data.invoice_number || invoice.data.id.slice(0, 8)}`,
      customerEmail: profile.data.email,
      customerName: profile.data.full_name || 'Elevate learner',
      successUrl: confirmation.href,
      cancelUrl: cancel.href,
    });
    const environment = process.env.AFFIRM_ENVIRONMENT || 'production';
    return NextResponse.json({
      publicKey: affirm.getPublicKey(),
      checkoutConfig,
      affirmJsUrl:
        environment === 'sandbox'
          ? 'https://cdn1-sandbox.affirm.com/js/v2/affirm.js'
          : 'https://cdn1.affirm.com/js/v2/affirm.js',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Affirm checkout is unavailable.';
    const safeMessage = /balance changed|no longer has an outstanding balance/i.test(message)
      ? message
      : 'Affirm checkout is temporarily unavailable.';
    return NextResponse.json({ error: safeMessage }, { status: 409 });
  }
}
