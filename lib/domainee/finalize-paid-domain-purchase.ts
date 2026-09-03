import 'server-only';
import type Stripe from 'stripe';
import { buyDomain, checkDomainPurchase } from '@/lib/domainee/client';
import type { DomaineeRegistrant } from '@/lib/domainee/types';
import { logger } from '@/lib/logger';

interface DomainPurchaseRow {
  id: string;
  website_id: string;
  user_id: string;
  hostname: string;
  status: string;
  payment_status: string | null;
  retail_cents: number | null;
  provider_cost_cents: number | null;
  origin_url: string | null;
  customer_reference: string | null;
  domainee_purchase_id: string | null;
  metadata: Record<string, unknown> | null;
}

export async function finalizePaidDomainPurchase({ db, stripe, session }: {
  db: any;
  stripe: Stripe;
  session: Stripe.Checkout.Session;
}) {
  if (session.metadata?.kind !== 'website_domain_purchase') return { handled: false as const };
  if (!['paid', 'no_payment_required'].includes(session.payment_status ?? '')) {
    return { handled: true as const, success: false, error: 'Payment is not confirmed.' };
  }

  const domainRecordId = session.metadata?.domain_record_id;
  const userId = session.metadata?.user_id;
  if (!domainRecordId || !userId) {
    return { handled: true as const, success: false, error: 'Missing domain checkout metadata.' };
  }

  const { data, error } = await db
    .from('website_domains')
    .select('id, website_id, user_id, hostname, status, payment_status, retail_cents, provider_cost_cents, origin_url, customer_reference, domainee_purchase_id, metadata')
    .eq('id', domainRecordId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) {
    return { handled: true as const, success: false, error: error?.message || 'Domain purchase record not found.' };
  }

  const row = data as DomainPurchaseRow;
  if (row.domainee_purchase_id || row.status === 'active' || row.status === 'processing') {
    return { handled: true as const, success: true, alreadyFinalized: true, domainId: row.id };
  }

  const paidCents = session.amount_total ?? 0;
  if (!row.retail_cents || paidCents < row.retail_cents) {
    return { handled: true as const, success: false, error: 'Stripe payment amount does not match the domain order.' };
  }

  const metadata = row.metadata ?? {};
  const registrant = metadata.registrant as DomaineeRegistrant | undefined;
  const years = Number(metadata.years ?? 1);
  if (!registrant || !row.origin_url) {
    return { handled: true as const, success: false, error: 'Domain registrant or origin data is missing.' };
  }

  try {
    const liveQuote = await checkDomainPurchase(row.hostname);
    if (!liveQuote.available) {
      await refundCheckout(stripe, session, 'Domain became unavailable before registration.');
      await db.from('website_domains').update({ status: 'failed', payment_status: 'refunded', error: 'Domain became unavailable before registration.' }).eq('id', row.id);
      return { handled: true as const, success: false, error: 'Domain became unavailable; payment refunded.' };
    }

    if (liveQuote.pricing.totalCents > paidCents) {
      await refundCheckout(stripe, session, 'Provider price increased above the amount collected.');
      await db.from('website_domains').update({
        status: 'failed',
        payment_status: 'refunded',
        provider_cost_cents: liveQuote.pricing.totalCents,
        error: 'Provider price changed before registration.',
      }).eq('id', row.id);
      return { handled: true as const, success: false, error: 'Domain price changed; payment refunded.' };
    }

    await db.from('website_domains').update({
      status: 'processing',
      payment_status: 'paid',
      provider_cost_cents: liveQuote.pricing.totalCents,
    }).eq('id', row.id);

    const result = await buyDomain(row.hostname, years, registrant, {
      originUrl: row.origin_url,
      customerReference: row.customer_reference ?? `elevate-${userId}-${row.website_id}`,
      idempotencyKey: `stripe-${session.id}`,
    });

    const purchase = result.purchase;
    await db.from('website_domains').update({
      domainee_domain_id: purchase.connectedDomainId ?? null,
      domainee_purchase_id: purchase.id,
      status: purchase.status === 'completed' ? 'active' : 'processing',
      payment_status: 'paid',
      provider_cost_cents: purchase.totalCents,
      updated_at: new Date().toISOString(),
    }).eq('id', row.id);

    return { handled: true as const, success: true, domainId: row.id, purchaseId: purchase.id };
  } catch (err) {
    logger.error('paid domain fulfillment failed', err instanceof Error ? err : undefined, {
      domainRecordId: row.id,
      hostname: row.hostname,
      stripeSessionId: session.id,
    });
    await db.from('website_domains').update({
      status: 'failed',
      error: err instanceof Error ? err.message : 'Domain registration failed.',
    }).eq('id', row.id);
    return { handled: true as const, success: false, error: err instanceof Error ? err.message : 'Domain registration failed.' };
  }
}

async function refundCheckout(stripe: Stripe, session: Stripe.Checkout.Session, reason: string) {
  const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntent) throw new Error(`${reason} Payment intent is unavailable for refund.`);
  await stripe.refunds.create({ payment_intent: paymentIntent, metadata: { reason } });
}
