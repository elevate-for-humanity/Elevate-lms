'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';
import {
  MIN_SETUP_FEE_CENTS,
  PAYMENT_TERM_WEEKS,
  TUITION_DOLLARS,
  weeklyPaymentCents,
} from '@/lib/barber/pricing';

const STANDARD_DOWN_PAYMENT = MIN_SETUP_FEE_CENTS / 100;
const OCTOBER_PROMO_DOWN_PAYMENT = 300;
const OCTOBER_PROMO_CODE = '50OFFOCT';

export default function BarberPaymentPlanner() {
  const [downPayment, setDownPayment] = useState(STANDARD_DOWN_PAYMENT);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const minimumDownPayment = couponApplied ? OCTOBER_PROMO_DOWN_PAYMENT : STANDARD_DOWN_PAYMENT;
  const weeklyPayment = useMemo(() => weeklyPaymentCents(downPayment) / 100, [downPayment]);
  const remaining = Math.max(0, TUITION_DOLLARS - downPayment);

  function applyCoupon() {
    if (couponCode.trim().toUpperCase() === OCTOBER_PROMO_CODE) {
      setCouponApplied(true);
      setDownPayment(OCTOBER_PROMO_DOWN_PAYMENT);
      setCouponMessage('Coupon applied — your startup deposit is $300.');
      return;
    }
    setCouponApplied(false);
    setDownPayment((current) => Math.max(STANDARD_DOWN_PAYMENT, current));
    setCouponMessage('That coupon code is not valid. Check the code and try again.');
  }

  return (
    <aside className="rounded-3xl border-2 border-sky-200 bg-white p-6 shadow-xl sm:p-8" aria-labelledby="barber-calculator-heading">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue-700 text-white">
          <CreditCard className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red-700">Payment calculator</p>
          <h3 id="barber-calculator-heading" className="mt-1 text-2xl font-black text-slate-950">Estimate your weekly plan</h3>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border-2 border-brand-red-200 bg-brand-red-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red-700">
          October enrollment special
        </p>
        <p className="mt-1 text-lg font-black text-slate-950">
          50% off the standard startup deposit
        </p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
          For a limited time, start with a $300 deposit instead of $600. Enter coupon code <strong>50OFFOCT</strong>.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="barber-coupon" className="sr-only">Coupon code</label>
          <input
            id="barber-coupon"
            type="text"
            value={couponCode}
            onChange={(event) => {
              setCouponCode(event.target.value);
              setCouponMessage('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyCoupon();
              }
            }}
            placeholder="Enter coupon code"
            autoComplete="off"
            className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 font-bold uppercase text-slate-950"
          />
          <button
            type="button"
            onClick={applyCoupon}
            className="min-h-11 rounded-xl bg-slate-950 px-5 font-black text-white hover:bg-slate-800"
          >
            Apply Coupon
          </button>
        </div>
        {couponMessage ? (
          <p className={`mt-2 text-sm font-bold ${couponApplied ? 'text-green-700' : 'text-red-700'}`} role="status">
            {couponMessage}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <label htmlFor="barber-down-payment" className="flex items-center justify-between gap-3 text-sm font-black text-slate-900">
          <span>Choose a down payment</span>
          <span className="text-xl text-brand-blue-900">${downPayment.toLocaleString()}</span>
        </label>
        <input
          id="barber-down-payment"
          type="range"
          min={minimumDownPayment}
          max={TUITION_DOLLARS}
          step={10}
          value={downPayment}
          onChange={(event) => setDownPayment(Number(event.target.value))}
          className="mt-4 w-full cursor-pointer accent-red-600"
        />
        <div className="mt-2 flex justify-between text-xs font-bold text-slate-600">
          <span>${minimumDownPayment.toLocaleString()} minimum{couponApplied ? ' with coupon' : ''}</span>
          <span>${TUITION_DOLLARS.toLocaleString()} paid in full</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        <PaymentFigure label="Tuition" value={`$${TUITION_DOLLARS.toLocaleString()}`} />
        <PaymentFigure label="Remaining" value={`$${remaining.toLocaleString()}`} />
        <PaymentFigure label={remaining ? `Weekly × ${PAYMENT_TERM_WEEKS}` : 'Balance'} value={remaining ? `$${weeklyPayment.toFixed(2)}` : '$0'} />
      </div>

      <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <p className="font-black text-slate-950">What is Buy Now, Pay Later?</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
          It is financing that may let you divide tuition into smaller scheduled payments instead of paying the full amount at once. The provider decides approval, payment dates, limits, and final terms.
        </p>
        <Link href="/programs/barber-apprenticeship/payment/bnpl" className="mt-3 inline-flex min-h-11 items-center font-black text-brand-blue-900 underline decoration-2 underline-offset-4">
          See Monthly Payment Options
        </Link>
      </div>

      <Link href={couponApplied ? "/programs/barber-apprenticeship/payment-setup?coupon=50OFFOCT" : "/programs/barber-apprenticeship/payment-setup"} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3.5 text-center font-black text-white hover:bg-brand-red-700">
        Continue to Secure Payment Setup
      </Link>
      <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-bold text-slate-600">
        <ShieldCheck className="h-4 w-4 text-brand-blue-700" aria-hidden="true" /> Estimate only. Review final terms before payment.
      </p>
    </aside>
  );
}

function PaymentFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sky-50 p-3 text-center">
      <p className="text-base font-black text-slate-950 sm:text-lg">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-600 sm:text-xs">{label}</p>
    </div>
  );
}
