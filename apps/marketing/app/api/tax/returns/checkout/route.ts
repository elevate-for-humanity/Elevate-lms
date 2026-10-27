import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getSecrets } from '@/lib/secrets';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';
import { taxJson } from '@/lib/tax-software/server/response';
import { loadTaxCheckoutOffer } from '@/lib/tax-software/server/checkout-offer';
import {
  refundFeeScheduleSchema,
  taxOfficePaymentProfileSchema,
  assertTaxOfficePaymentIdentity,
} from '@/lib/tax-software/refund-payment';
import { taxReturnSourceDigest } from '@/lib/tax-software/security/return-digest';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const selection = z
  .object({
    returnId: z.string().uuid(),
    quoteDigest: z.string().regex(/^[a-f0-9]{64}$/),
    method: z.enum(['upfront', 'refund_transfer']),
  })
  .strict();

async function feeSchedule() {
  const keys = await getSecrets(['TAX_EPS_REFUND_TRANSFER_FEES_JSON']);
  const raw = keys.TAX_EPS_REFUND_TRANSFER_FEES_JSON;
  return raw ? refundFeeScheduleSchema.parse(JSON.parse(raw)) : null;
}
async function paymentProfile() {
  const keys = await getSecrets(['TAX_OFFICE_PAYMENT_PROFILE_JSON']);
  const raw = keys.TAX_OFFICE_PAYMENT_PROFILE_JSON;
  return raw ? taxOfficePaymentProfileSchema.parse(JSON.parse(raw)) : null;
}
function failed(error: unknown) {
  if (error instanceof Error && error.message === 'RECALCULATE')
    return taxJson(
      { error: 'Calculate and review the current return before choosing payment.' },
      { status: 422 },
    );
  return taxJson(
    { error: 'Unable to prepare payment options. No payment was recorded.' },
    { status: 503 },
  );
}
export async function GET(req: NextRequest) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return taxJson({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('returnId');
  if (!z.string().uuid().safeParse(id).success)
    return taxJson({ error: 'A valid return is required.' }, { status: 400 });
  try {
    const offer = await loadTaxCheckoutOffer(db, id!, user.id, await feeSchedule());
    if (!offer) return taxJson({ error: 'Return not found' }, { status: 404 });
    // Only the provider ledger can establish payment. A saved choice is not paid.
    return taxJson({
      quote: offer.quote,
      options: offer.options,
      quoteDigest: offer.quoteDigest,
      upfrontConfigured: Boolean(await paymentProfile()),
      selection: offer.record.return_json?.checkout?.method ?? null,
      selectionStatus: offer.record.return_json?.checkout?.status ?? null,
    });
  } catch (error) {
    return failed(error);
  }
}
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'payment');
  if (limited) return limited;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return taxJson({ error: 'Unauthorized' }, { status: 401 });
  const parsed = selection.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return taxJson({ error: 'Review the payment choice.' }, { status: 400 });
  try {
    const offer = await loadTaxCheckoutOffer(
      db,
      parsed.data.returnId,
      user.id,
      await feeSchedule(),
    );
    if (!offer) return taxJson({ error: 'Return not found' }, { status: 404 });
    if (offer.quoteDigest !== parsed.data.quoteDigest)
      return taxJson(
        { error: 'The refund or fees changed. Refresh and review the new quote.' },
        { status: 409 },
      );
    if (offer.options.noFeeDue) return taxJson({ status: 'no_fee_due', amountCents: 0 });
    const previous = offer.record.return_json?.checkout;
    if (parsed.data.method === 'refund_transfer' && previous?.invoiceId)
      return taxJson(
        {
          error:
            'An upfront invoice already exists. Contact the office before changing payment methods.',
        },
        { status: 409 },
      );
    if (parsed.data.method === 'refund_transfer' && !offer.options.canRequestRefundTransfer)
      return taxJson(
        {
          error: 'The estimated federal refund does not cover these fees. Choose upfront payment.',
        },
        { status: 422 },
      );
    if (
      parsed.data.method === 'refund_transfer' &&
      !['draft', 'in_progress', 'review', 'ready_for_review'].includes(offer.record.status)
    )
      return taxJson(
        { error: 'Choose the bank product before transmitting the original return.' },
        { status: 422 },
      );
    let url: string | undefined, invoiceId: string | undefined;
    let status: 'awaiting_eps_application' | 'awaiting_office_payment_setup' | 'invoice_open' =
      'awaiting_eps_application';
    if (parsed.data.method === 'upfront') {
      const profile = await paymentProfile();
      if (!profile) status = 'awaiting_office_payment_setup';
      else {
        if (!user.email)
          return taxJson({ error: 'An account email is required for payment.' }, { status: 422 });
        const admin = await requireAdminClient();
        const config = await loadQuickBooksConfig(admin);
        const identity = await quickBooksRequest<{
          CompanyInfo: { LegalName: string; CompanyName: string };
        }>(admin, config, `companyinfo/${encodeURIComponent(config.realmId)}`);
        assertTaxOfficePaymentIdentity(
          profile,
          config.realmId,
          identity.CompanyInfo.LegalName,
          identity.CompanyInfo.CompanyName,
        );
        if (previous?.invoiceId) {
          const old = await admin
            .from('billing_invoices')
            .select('id,total_cents,status,payment_url,idempotency_key')
            .eq('id', previous.invoiceId)
            .eq('customer_external_key', `user:${user.id}`)
            .maybeSingle();
          if (old.error || !old.data) throw Error('INVOICE_READ_FAILED');
          const previousKey =
            'tax-self-file:' +
            taxReturnSourceDigest({
              user: user.id,
              return: offer.record.id,
              amount: old.data.total_cents,
            });
          if (old.data.idempotency_key !== previousKey) throw Error('INVOICE_RETURN_MISMATCH');
          if (old.data.status === 'paid')
            return taxJson({
              status: 'paid',
              invoiceId: old.data.id,
              amountCents: old.data.total_cents,
              currentQuoteMatches: old.data.total_cents === offer.options.upfrontAmountCents,
            });
          if (!['open', 'past_due'].includes(old.data.status))
            return taxJson(
              {
                error:
                  'Contact the office to review the existing invoice before starting another payment.',
              },
              { status: 409 },
            );
          if (old.data.total_cents !== offer.options.upfrontAmountCents)
            return taxJson(
              {
                error:
                  'Your fee changed after an invoice was created. Contact the office to adjust it before paying.',
              },
              { status: 409 },
            );
        }
        const key =
          'tax-self-file:' +
          taxReturnSourceDigest({
            user: user.id,
            return: offer.record.id,
            amount: offer.options.upfrontAmountCents,
          });
        const invoice = await createQuickBooksBillingProvider(admin).createManualInvoice({
          idempotencyKey: key,
          customer: {
            externalKey: `user:${user.id}`,
            displayName: `Supersonic Fast Cash customer ${user.id}`,
            email: user.email,
          },
          lines: [
            {
              canonicalKey: 'sfc-self-file-software',
              name: 'Supersonic Fast Cash software access',
              quantity: 1,
              unitAmountCents: offer.options.upfrontAmountCents,
            },
          ],
          dueDate: new Date().toISOString().slice(0, 10),
        });
        if (!invoice.paymentUrl || invoice.totalCents !== offer.options.upfrontAmountCents)
          throw Error('INVOICE_NOT_READY');
        const link = new URL(invoice.paymentUrl);
        if (
          link.protocol !== 'https:' ||
          !/(^|\.)(intuit\.com|qbo\.intuit\.com)$/.test(link.hostname)
        )
          throw Error('INVALID_PAYMENT_URL');
        const tracked = await admin
          .from('billing_invoices')
          .select('id')
          .eq('idempotency_key', key)
          .single();
        if (tracked.error || !tracked.data) throw Error('INVOICE_NOT_TRACKED');
        url = invoice.paymentUrl;
        invoiceId = tracked.data.id;
        status = 'invoice_open';
      }
    }
    const checkout = {
      version: 1,
      method: parsed.data.method,
      status,
      provider: parsed.data.method === 'refund_transfer' ? 'eps' : 'quickbooks',
      officeLegalName: 'HOTT KAMODITTY',
      officeDba: 'Supersonic Fast Cash',
      officeDepositBank: 'Lili',
      quoteDigest: offer.quoteDigest,
      softwareFeeCents: offer.options.upfrontAmountCents,
      providerFeeCents: offer.options.providerFeeCents,
      feeScheduleVersion: offer.options.feeSchedule?.version ?? null,
      invoiceId: invoiceId ?? null,
      requestedAt: new Date().toISOString(),
      bankAgreementSigned: false,
      consent7216Recorded: false,
      bankSubmitted: false,
    };
    const saved = await db
      .from('tax_returns')
      .update({
        return_json: { ...offer.record.return_json, checkout },
        updated_at: checkout.requestedAt,
      })
      .eq('id', offer.record.id)
      .eq('created_by_user_id', user.id)
      .eq('service_type', 'self_file')
      .eq('updated_at', offer.record.updated_at)
      .select('id')
      .maybeSingle();
    if (saved.error) throw Error('CHECKOUT_SAVE_FAILED');
    if (!saved.data)
      return taxJson(
        {
          error:
            'The return changed. Refresh before continuing. Any created invoice remains in your payment ledger.',
        },
        { status: 409 },
      );
    return taxJson({
      status,
      url,
      invoiceId,
      amountCents: offer.options.upfrontAmountCents,
      message:
        parsed.data.method === 'refund_transfer'
          ? 'Your EPS preference is saved. The exact fees, bank application and required consents must be completed before any refund transfer.'
          : status === 'awaiting_office_payment_setup'
            ? 'Your upfront payment preference is saved. The Supersonic Fast Cash payment account must be verified before a payment link is issued.'
            : 'Complete payment on the secure invoice. Opening or returning from the invoice does not confirm payment.',
    });
  } catch (error) {
    return failed(error);
  }
}
