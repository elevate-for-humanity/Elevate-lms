'use client';
import { useEffect, useState } from 'react';
import type { TaxPaymentOptions as Options } from '@/lib/tax-software/refund-payment';
type Offer = {
  options: Options;
  quoteDigest: string;
  upfrontConfigured: boolean;
  selection: string | null;
  selectionStatus: string | null;
};
const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export function TaxPaymentOptions({
  returnId,
  calculationDigest,
}: {
  returnId: string;
  calculationDigest: string | null;
}) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [method, setMethod] = useState<'upfront' | 'refund_transfer'>('upfront');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    setOffer(null);
    setError('');
    setMessage('');
    if (!calculationDigest) return;
    void (async () => {
      try {
        const response = await fetch(
          '/api/tax/returns/checkout?returnId=' + encodeURIComponent(returnId),
          { cache: 'no-store' },
        );
        const data = await response.json();
        if (!response.ok) throw Error(data.error || 'Unable to load payment options');
        if (active) {
          setOffer(data);
          setMethod(
            data.selection === 'refund_transfer' && data.options.canRequestRefundTransfer
              ? 'refund_transfer'
              : 'upfront',
          );
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Unable to load payment options');
      }
    })();
    return () => {
      active = false;
    };
  }, [returnId, calculationDigest]);
  async function continuePayment() {
    if (!offer) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/tax/returns/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ returnId, method, quoteDigest: offer.quoteDigest }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Unable to save payment choice');
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      if (data.status === 'paid') {
        setMessage(
          data.currentQuoteMatches
            ? 'Your invoice payment is recorded.'
            : 'An earlier invoice is paid. Contact the office to reconcile the changed fee.',
        );
      } else setMessage(data.message || 'No software fee is due.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save payment choice');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"
      aria-labelledby="tax-payment-heading"
    >
      <h2 id="tax-payment-heading" className="text-2xl font-bold">
        Choose how to pay
      </h2>
      {!calculationDigest && (
        <p className="mt-3 text-slate-600">
          Calculate and review your return to see your payment options.
        </p>
      )}
      {calculationDigest && !offer && !error && (
        <p className="mt-3" role="status">
          Loading your payment options…
        </p>
      )}
      {offer &&
        (offer.options.noFeeDue ? (
          <p className="mt-3">
            Your current software fee is $0. No payment or refund-transfer product is needed.
          </p>
        ) : (
          <>
            <p className="mt-3">
              Software fee: <strong>{money(offer.options.upfrontAmountCents)}</strong>
            </p>
            <fieldset className="mt-5 space-y-4" disabled={busy}>
              <legend className="sr-only">Payment method</legend>
              <label className="flex gap-3 rounded-xl border p-4">
                <input
                  type="radio"
                  name="tax-payment"
                  value="upfront"
                  checked={method === 'upfront'}
                  onChange={() => setMethod('upfront')}
                />
                <span>
                  <strong>Pay upfront</strong>
                  <span className="mt-1 block text-sm text-slate-600">
                    {offer.upfrontConfigured
                      ? 'Continue to a secure hosted invoice. Available payment methods are shown there.'
                      : 'Save your preference. Payment links will be available after the Supersonic Fast Cash payment account is verified.'}
                  </span>
                </span>
              </label>
              {offer.options.canRequestRefundTransfer && (
                <label className="flex gap-3 rounded-xl border p-4">
                  <input
                    type="radio"
                    name="tax-payment"
                    value="refund_transfer"
                    checked={method === 'refund_transfer'}
                    onChange={() => setMethod('refund_transfer')}
                  />
                  <span>
                    <strong>Request pay-by-refund</strong>
                    <span className="mt-1 block text-sm text-slate-600">
                      Ask to pay from your refund through EPS Financial, subject to its application
                      and approval.
                    </span>
                  </span>
                </label>
              )}
            </fieldset>
            {!offer.options.canRequestRefundTransfer && (
              <p className="mt-4 text-sm text-slate-600">
                The estimated federal refund does not cover the fees. Upfront payment is available.
              </p>
            )}
            {method === 'refund_transfer' && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
                <p>
                  Estimated federal refund:{' '}
                  <strong>{money(offer.options.federalRefundCents)}</strong>
                </p>
                {offer.options.feeSchedule ? (
                  <>
                    <ul className="mt-3 space-y-1">
                      {offer.options.feeSchedule.fees.map((fee, i) => (
                        <li key={i}>
                          {fee.label}: {money(fee.amountCents)}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3">
                      Total software and provider fees:{' '}
                      <strong>{money(offer.options.totalFeesCents!)}</strong>
                    </p>
                    <p>
                      Estimated refund after fees:{' '}
                      <strong>{money(offer.options.estimatedNetRefundCents!)}</strong>
                    </p>
                  </>
                ) : (
                  <p className="mt-3">
                    The EPS processing fee has not been quoted. Exact charges and your remaining
                    refund must be shown before you accept the bank agreement.
                  </p>
                )}
                <p className="mt-3">
                  This saves a preference only. The bank application, refund account details and
                  required disclosure and use consents must be completed separately. No bank account
                  is opened and no fee is deducted by this request.
                </p>
                <p className="mt-3">
                  Refunds may be delayed, reduced or offset. An estimate does not guarantee
                  eligibility, funding or payment of your fees.
                </p>
              </div>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={continuePayment}
              className="mt-5 rounded-xl bg-red-700 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              {busy
                ? 'Saving…'
                : method === 'refund_transfer'
                  ? 'Save pay-by-refund request'
                  : offer.upfrontConfigured
                    ? 'Continue to secure payment'
                    : 'Save upfront payment preference'}
            </button>
            {offer.selectionStatus === 'awaiting_eps_application' && (
              <p className="mt-3 text-sm">
                Saved request: awaiting the EPS application and agreements.
              </p>
            )}
          </>
        ))}
      {error && (
        <p role="alert" className="mt-4 text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-4 font-semibold">
          {message}
        </p>
      )}
    </section>
  );
}
