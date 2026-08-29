'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import {
  IMPLEMENTATION_PACKAGES,
  formatImplementationPrice,
  type ImplementationPackageId,
} from '@/lib/store/implementation-packages';

type PaymentChoice = 'deposit' | 'full';

export function StandaloneBuildPackages({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(packageId: ImplementationPackageId, paymentChoice: PaymentChoice) {
    const requestKey = `${packageId}:${paymentChoice}`;
    setLoading(requestKey);
    setError(null);

    try {
      const response = await fetch('/api/store/implementation-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, paymentChoice }),
      });
      const result = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error || 'Secure checkout could not be started.');
      }
      window.location.href = result.checkoutUrl;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Secure checkout could not be started.',
      );
      setLoading(null);
    }
  }

  const packages = Object.values(IMPLEMENTATION_PACKAGES);

  return (
    <section
      className={compact ? 'bg-white py-12' : 'bg-gradient-to-b from-slate-50 to-white py-16'}
      id="standalone-build-packages"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-red-700">
            Standalone platform builds
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">
            Your brand. Your deployment. Your customer data.
          </h2>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-700 sm:text-lg">
            Launch an independently deployed website, client portal and learning platform using
            Elevate&apos;s proven builder foundation. Every option supports unlimited course and
            lesson creation.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mx-auto mt-7 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-center font-semibold text-red-800"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {packages.map((item) => {
            const depositKey = `${item.id}:deposit`;
            const fullKey = `${item.id}:full`;
            return (
              <article
                key={item.id}
                className={`relative flex flex-col rounded-3xl border bg-white p-7 shadow-lg ${item.recommended ? 'border-brand-red-400 ring-4 ring-brand-red-100' : 'border-slate-200'}`}
              >
                {item.recommended ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand-red-700 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                    Recommended
                  </span>
                ) : null}
                <p className="text-sm font-black uppercase tracking-wide text-brand-red-700">
                  Delivery {item.deliveryWindow}
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{item.name}</h3>
                <p className="mt-3 min-h-20 text-sm font-semibold leading-6 text-slate-700">
                  {item.shortDescription}
                </p>

                <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                  <p className="text-4xl font-black">
                    {formatImplementationPrice(item.totalCents)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-200">
                    {formatImplementationPrice(item.depositCents)} down, then{' '}
                    {formatImplementationPrice(item.installmentCents)} × {item.installmentCount}{' '}
                    monthly invoices
                  </p>
                  <p className="mt-2 text-xs font-semibold text-amber-200">
                    Monthly installments are manually invoiced and are not silently auto-charged.
                  </p>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {item.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm font-semibold leading-5 text-slate-800"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-600">
                    Initial content setup
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                    {item.initialContent.join(' · ')}
                  </p>
                </div>

                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => checkout(item.id, 'deposit')}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 py-3 font-black text-white hover:bg-brand-red-800 disabled:cursor-wait disabled:opacity-60"
                  >
                    {loading === depositKey ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CreditCard className="h-5 w-5" />
                    )}
                    Pay {formatImplementationPrice(item.depositCents)} Deposit
                  </button>
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => checkout(item.id, 'full')}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-800 bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
                  >
                    {loading === fullKey ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                    Pay in Full
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-9 max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold leading-6 text-slate-800">
          <strong>Purchase terms:</strong> A deposit reserves onboarding. Work begins after the
          signed scope and required materials are received. The buyer owns its branding, content and
          customer data. Elevate retains its reusable builder, course-runner and PARIS platform
          technology and grants the buyer a perpetual business-use license after full payoff.
          Hosting, database, AI, email, video, domain and payment-processing costs are separate.
          <Link
            href="/contact?topic=standalone-platform-build"
            className="ml-2 font-black text-brand-red-800 underline underline-offset-2"
          >
            Questions before purchasing?
          </Link>
        </div>
      </div>
    </section>
  );
}
