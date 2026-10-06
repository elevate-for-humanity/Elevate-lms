// pre-auth-registry: exempt - resolveOwnedSite verifies the authenticated user and website ownership before any insert; its error result is returned immediately.
import { NextRequest, NextResponse } from 'next/server';
import { checkDomainPurchase, isDomaineeConfigured } from '@/lib/domainee/client';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireCustomDomainEntitlement, resolveOwnedSite, validateHostname } from '@/lib/domainee/site-resolver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  const resolved = await resolveOwnedSite(websiteId);
  if ('error' in resolved) return resolved.error;
  const entitlementError = requireCustomDomainEntitlement(resolved.entitlement);
  if (entitlementError) return entitlementError;
  if (!isDomaineeConfigured()) return NextResponse.json({ error: 'Domain service is temporarily unavailable.' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const hostname = validateHostname(String(body.hostname || ''));
  if (!hostname) return NextResponse.json({ error: 'Enter a valid domain.' }, { status: 400 });
  const registrant = body.registrant && typeof body.registrant === 'object' ? body.registrant : null;
  if (!registrant) return NextResponse.json({ error: 'Registrant information is required.' }, { status: 400 });

  const quote = await checkDomainPurchase(hostname);
  if (!quote.available) return NextResponse.json({ error: 'That domain is no longer available.' }, { status: 409 });
  const markupCents = Math.max(0, Number(process.env.DOMAIN_RETAIL_MARKUP_CENTS ?? 1000) || 1000);
  const retailCents = quote.pricing.totalCents + markupCents;
  const db = await requireAdminClient();
  const { data: profile } = await db.from('profiles').select('full_name,email').eq('id', resolved.user.id).maybeSingle();
  const email = profile?.email || resolved.user.email;
  if (!email) return NextResponse.json({ error: 'A billing email is required.' }, { status: 400 });

  const { data: domain, error } = await db.from('website_domains').insert({
    website_id: websiteId,
    user_id: resolved.user.id,
    hostname,
    mode: 'purchase',
    status: 'awaiting_payment',
    payment_status: 'pending',
    provider_cost_cents: quote.pricing.totalCents,
    retail_cents: retailCents,
    origin_url: resolved.originUrl,
    customer_reference: `elevate-${resolved.user.id}-${websiteId}`,
    billing_provider: 'quickbooks',
    metadata: { registrant, years: 1 },
  }).select('id').single();
  if (error || !domain) return NextResponse.json({ error: error?.message || 'Could not prepare domain order.' }, { status: 500 });

  try {
    const invoice = await createQuickBooksBillingProvider(db).createManualInvoice({
      idempotencyKey: `website-domain:${domain.id}`,
      customer: { externalKey: `user:${resolved.user.id}`, displayName: profile?.full_name || email, email },
      lines: [{ canonicalKey: `domain:${hostname}`, name: `Domain registration — ${hostname}`, description: 'One-year domain registration', quantity: 1, unitAmountCents: retailCents }],
      dueDate: new Date().toISOString().slice(0, 10),
      memo: `Website Builder domain ${hostname}`,
      fulfillment: { type: 'website_domain_purchase', payload: { domain_record_id: domain.id, user_id: resolved.user.id, amount_cents: retailCents } },
    });
    await db.from('website_domains').update({ provider_invoice_id: invoice.providerInvoiceId, updated_at: new Date().toISOString() }).eq('id', domain.id);
    if (!invoice.paymentUrl) throw new Error('Online invoice payment is not enabled.');
    return NextResponse.json({ checkoutUrl: invoice.paymentUrl, domainId: domain.id, invoiceId: invoice.providerInvoiceId });
  } catch (cause) {
    await db.from('website_domains').update({ status: 'failed', error: cause instanceof Error ? cause.message : 'Invoice creation failed.' }).eq('id', domain.id);
    return NextResponse.json({ error: 'Unable to start domain checkout.' }, { status: 500 });
  }
}
