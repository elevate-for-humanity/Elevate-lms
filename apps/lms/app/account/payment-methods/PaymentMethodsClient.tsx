import type { ApprenticeDashboardInvoice } from '@/lib/billing/apprentice-invoice-batch';
import { AffirmInvoiceButton } from '@/components/payments/AffirmInvoiceButton';
import { NonRefundableDepositNotice } from '@/components/payments/NonRefundableDepositNotice';

type Schedule = {
  id: string;
  product_name: string;
  amount_cents: number;
  cadence: string;
  status: string;
  collection_mode: string;
  provider_status: string | null;
  provider_approval_url: string | null;
};

function safePaymentUrl(value: string | null, provider: 'paypal' | 'quickbooks'): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const domain = provider === 'paypal' ? 'paypal.com' : 'intuit.com';
    return url.protocol === 'https:' && (host === domain || host.endsWith(`.${domain}`))
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function amount(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function PaymentMethodsClient({
  invoices,
  schedules,
}: {
  invoices: ApprenticeDashboardInvoice[];
  schedules: Schedule[];
}) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-3xl font-black text-slate-950">Billing and payment options</h1>
        <p className="mt-2 text-slate-700">
          Pay an invoice through its secure QuickBooks link. Recurring PayPal payments begin only
          after you approve the agreement in PayPal.
        </p>
      </header>

      <NonRefundableDepositNotice compact />

      <section
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-labelledby="billing-schedules-heading"
      >
        <h2 id="billing-schedules-heading" className="text-xl font-bold text-slate-950">
          Payment schedules
        </h2>
        {schedules.length ? (
          <ul className="mt-4 divide-y divide-slate-200">
            {schedules.map((schedule) => {
              const approvalUrl = safePaymentUrl(schedule.provider_approval_url, 'paypal');
              const needsApproval =
                schedule.collection_mode === 'automatic' && schedule.provider_status !== 'active';
              return (
                <li key={schedule.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                  <p className="font-semibold text-slate-950">{schedule.product_name}</p>
                  <p className="text-sm text-slate-700">
                    {amount(Number(schedule.amount_cents))} {schedule.cadence} · {schedule.status}
                  </p>
                  {needsApproval && approvalUrl ? (
                    <a
                      className="inline-block rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white"
                      href={approvalUrl}
                      rel="noopener noreferrer"
                    >
                      Approve automatic payments in PayPal
                    </a>
                  ) : needsApproval ? (
                    <p className="text-sm text-amber-800">
                      Your automatic payment agreement is awaiting setup. Contact Elevate for the
                      secure PayPal approval link.
                    </p>
                  ) : schedule.collection_mode === 'automatic' ? (
                    <p className="text-sm text-green-800">PayPal agreement active</p>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Pay individual QuickBooks invoices below.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-slate-700">No payment schedule is assigned to your account.</p>
        )}
      </section>

      <section
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-labelledby="invoices-heading"
      >
        <h2 id="invoices-heading" className="text-xl font-bold text-slate-950">
          Invoices
        </h2>
        {invoices.length ? (
          <ul className="mt-4 divide-y divide-slate-200">
            {invoices.map((invoice) => {
              const paymentUrl = safePaymentUrl(invoice.paymentUrl, 'quickbooks');
              const payable = ['open', 'past_due'].includes(invoice.status.toLowerCase());
              return (
                <li
                  key={invoice.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      Invoice {invoice.invoiceNumber || invoice.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-slate-700">
                      {amount(invoice.amountCents)} · {invoice.status}
                      {invoice.dueDate ? ` · Due ${invoice.dueDate}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {paymentUrl && payable ? (
                      <a
                        className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white"
                        href={paymentUrl}
                        rel="noopener noreferrer"
                      >
                        Pay with PayPal or card
                      </a>
                    ) : null}
                    {payable && invoice.amountCents >= 5_000 && invoice.amountCents <= 3_000_000 ? (
                      <AffirmInvoiceButton billingInvoiceId={invoice.id} />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-slate-700">No invoices are assigned to your account.</p>
        )}
        {invoices.some((invoice) => ['open', 'past_due'].includes(invoice.status.toLowerCase())) ? (
          <p className="mt-4 text-xs leading-5 text-slate-600">
            Affirm financing is a separate application. Eligibility, APR, and payment terms are
            determined by Affirm.
          </p>
        ) : null}
      </section>
    </main>
  );
}
