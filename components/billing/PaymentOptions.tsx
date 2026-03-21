import React from 'react';

type Props = {
  price?: number;
  programName?: string;
};

export default function PaymentOptions({ price, programName }: Props) {
  return (
    <section className="mt-6 rounded-2xl border p-5 shadow-sm">
      <h3 className="text-xl font-semibold">Payment Options</h3>
      <p className="mt-1 text-sm text-black">
        Choose the option that fits your situation. If you're using workforce
        funding (WIOA/WRG/JRI/Employer), select that during checkout or after
        you apply.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="font-semibold">Pay in Full (Card)</div>
          <div className="mt-1 text-sm text-black">
            Visa, Mastercard, Amex, Discover.
            {typeof price === 'number' ? (
              <div className="mt-1">
                Total:{' '}
                <span className="font-medium">${price.toLocaleString()}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="font-semibold">Pay in 4 (If Available)</div>
          <div className="mt-1 text-sm text-black">
            Klarna / Afterpay / Zip (availability depends on Stripe settings,
            purchase amount, and eligibility).
          </div>
          <ul className="mt-2 list-disc pl-5 text-sm text-black">
            <li>Pay in 4 interest-free installments</li>
            <li>Instant decision at checkout</li>
            <li>Some options may not appear for certain totals</li>
          </ul>
        </div>

        <div className="rounded-xl border p-4">
          <div className="font-semibold">
            Workforce Funding (WIOA / WRG / JRI)
          </div>
          <div className="mt-1 text-sm text-black">
            If you qualify, your training may be fully covered. We'll guide you
            through the steps after you apply.
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="font-semibold">Employer Paid / Sponsorship</div>
          <div className="mt-1 text-sm text-black">
            Your employer can sponsor your training. We can provide an invoice
            or sponsorship agreement.
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-black">
        <div className="font-medium">Note:</div>
        <div className="mt-1">
          Pay-over-time options show automatically at checkout if they're
          enabled in Stripe and supported for your cart. If you don't see them,
          it usually means that option isn't available for that purchase amount
          or eligibility.
        </div>
      </div>
    </section>
  );
}
