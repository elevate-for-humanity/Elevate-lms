import { NextRequest, NextResponse } from 'next/server';
import { affirm } from '@/lib/affirm/client';
import { affirmInvoiceOrderId, invoiceBelongsToUser } from '@/lib/billing/invoice-checkout';
import {
  getQuickBooksInvoiceCollectionState,
  recordQuickBooksInvoiceExternalPayment,
} from '@/lib/billing/providers/quickbooks';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function accountRedirect(request: NextRequest, result: string) {
  const url = new URL('/account/payment-methods', request.url);
  url.searchParams.set('affirm', result);
  return NextResponse.redirect(url, 303);
}

export async function GET(request: NextRequest) {
  const checkoutToken = request.nextUrl.searchParams.get('checkout_token')?.trim() || '';
  const orderId = request.nextUrl.searchParams.get('order_id')?.trim() || '';
  const billingInvoiceId = request.nextUrl.searchParams.get('billingInvoiceId')?.trim() || '';
  if (!checkoutToken || checkoutToken.length < 8 || checkoutToken.length > 256) {
    return accountRedirect(request, 'invalid_token');
  }
  if (!UUID_RE.test(billingInvoiceId) || orderId.length > 128) {
    return accountRedirect(request, 'invalid_invoice');
  }

  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    const login = new URL('/login', request.url);
    login.searchParams.set('redirect', '/account/payment-methods?affirm=session_expired');
    return NextResponse.redirect(login, 303);
  }

  const db = await requireAdminClient();
  const [profile, invoice] = await Promise.all([
    db.from('profiles').select('email').eq('id', user.id).maybeSingle(),
    db
      .from('billing_invoices')
      .select(
        'id,customer_external_key,customer_email,total_cents,currency,status,provider_payment_id,provider_payment_status,collection_provider',
      )
      .eq('id', billingInvoiceId)
      .maybeSingle(),
  ]);
  if (
    profile.error ||
    invoice.error ||
    !profile.data ||
    !invoice.data ||
    !invoiceBelongsToUser(invoice.data, user.id, profile.data.email)
  ) {
    return accountRedirect(request, 'invoice_not_found');
  }
  if (
    invoice.data.status === 'paid' &&
    invoice.data.collection_provider === 'affirm' &&
    invoice.data.provider_payment_id &&
    invoice.data.provider_payment_status === 'recorded'
  ) {
    return accountRedirect(request, 'success');
  }
  if (!['open', 'past_due'].includes(invoice.data.status) || invoice.data.currency !== 'USD') {
    return accountRedirect(request, 'invoice_not_payable');
  }

  let chargeId: string | null = null;
  try {
    const current = await getQuickBooksInvoiceCollectionState(db, invoice.data.id);
    if (orderId !== affirmInvoiceOrderId(invoice.data.id, current.amountCents)) {
      return accountRedirect(request, 'invalid_order');
    }
    await hydrateProcessEnv();
    affirm.tryLateConfig();
    if (!affirm.isConfigured()) return accountRedirect(request, 'configuration');

    const authorized = await affirm.authorizeCharge(checkoutToken, orderId);
    chargeId = authorized.id;
    if (authorized.amount !== current.amountCents || authorized.currency !== 'USD') {
      await affirm.voidCharge(authorized.id);
      return accountRedirect(request, 'amount_mismatch');
    }
    const captured = await affirm.captureCharge(authorized.id, orderId, current.amountCents);
    chargeId = captured.id || authorized.id;
    const paidAt = new Date().toISOString();
    const event = await db.from('billing_provider_events').upsert(
      {
        provider: 'affirm',
        provider_event_id: chargeId,
        event_type: 'INVOICE.PAYMENT.CAPTURED',
        resource_id: invoice.data.id,
        status: 'processing',
        attempts: 1,
        payload: {
          billingInvoiceId: invoice.data.id,
          amountCents: current.amountCents,
          currency: 'USD',
        },
        error_message: null,
        updated_at: paidAt,
      },
      { onConflict: 'provider,provider_event_id' },
    );
    if (event.error) throw new Error(event.error.message);

    await recordQuickBooksInvoiceExternalPayment(db, {
      billingInvoiceId: invoice.data.id,
      collectionProvider: 'affirm',
      providerPaymentId: chargeId,
      paidAt,
    });
    await db
      .from('billing_provider_events')
      .update({ status: 'completed', processed_at: paidAt, updated_at: paidAt })
      .eq('provider', 'affirm')
      .eq('provider_event_id', chargeId);
    return accountRedirect(request, 'success');
  } catch (error) {
    logger.error('[Affirm invoice capture] Payment finalization failed', error, {
      billingInvoiceId,
      chargeId,
    });
    if (chargeId) {
      await db
        .from('billing_provider_events')
        .update({
          status: 'failed',
          attempts: 1,
          error_message: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('provider', 'affirm')
        .eq('provider_event_id', chargeId);
    }
    return accountRedirect(request, 'review_required');
  }
}
