'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, CreditCard, Loader2 } from 'lucide-react';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { BARBER_PRICING, calculateWeeklyPayment } from '@/lib/programs/pricing';

type PaymentOption = 'full' | 'deposit' | 'installment';

type ProgramPricing = {
  fullPrice: number;
  deposit: number;
  name: string;
  weeks: number;
  weeklyPayment: number;
};

const barberWeekly = calculateWeeklyPayment(
  40,
  0,
  BARBER_PRICING.defaultDownPayment,
).weeklyPaymentDollars;

// Display values are dollars. Checkout amounts remain server-authoritative.
const PROGRAM_PRICING: Record<string, ProgramPricing> = {
  'barber-apprenticeship': {
    fullPrice: BARBER_PRICING.fullPrice,
    deposit: BARBER_PRICING.defaultDownPayment,
    name: 'Barber Apprenticeship Program',
    weeklyPayment: barberWeekly,
    weeks: BARBER_PRICING.paymentTermWeeks,
  },
  'esthetician-apprenticeship': {
    fullPrice: 5500,
    deposit: 600,
    name: 'Esthetician Apprenticeship Program',
    weeklyPayment: 205,
    weeks: 24,
  },
  'cosmetology-apprenticeship': {
    fullPrice: 5500,
    deposit: 600,
    name: 'Cosmetology Apprenticeship Program',
    weeklyPayment: 205,
    weeks: 24,
  },
  'nail-technician-apprenticeship': {
    fullPrice: 3500,
    deposit: 350,
    name: 'Nail Technician Apprenticeship Program',
    weeklyPayment: 130,
    weeks: 24,
  },
};

export default function EnrollPaymentPage() {
  const searchParams = useSafeSearchParams();
  const applicationId = searchParams.get('application_id');
  const canceled = searchParams.get('canceled');
  const requestedProgram = searchParams.get('program') || 'barber-apprenticeship';
  const pricing = PROGRAM_PRICING[requestedProgram] || PROGRAM_PRICING['barber-apprenticeship'];

  const [selectedOption, setSelectedOption] = useState<PaymentOption>('deposit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [applicationValid, setApplicationValid] = useState(false);

  const options = useMemo(
    () => [
      {
        id: 'full' as const,
        label: 'Pay in Full',
        amount: pricing.fullPrice,
        description: 'One payment for the full program balance.',
      },
      {
        id: 'deposit' as const,
        label: 'Down Payment',
        amount: pricing.deposit,
        description: `Pay $${pricing.deposit.toLocaleString()} now; the remaining approved balance is billed under your enrollment payment schedule.`,
      },
      {
        id: 'installment' as const,
        label: 'Payment Plan',
        amount: pricing.weeklyPayment,
        description: `Approximately $${pricing.weeklyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })} per week for ${pricing.weeks} weeks after the required down payment. Final schedule is confirmed at checkout.`,
      },
    ],
    [pricing],
  );

  useEffect(() => {
    async function verifyApplication() {
      if (!applicationId) {
        setError('No application found. Please apply first.');
        setVerifying(false);
        return;
      }

      try {
        const verifyResponse = await fetch(`/api/applications/${applicationId}/verify`, { cache: 'no-store' });
        if (verifyResponse.ok) {
          setApplicationValid(true);
        } else {
          const applicationResponse = await fetch(`/api/applications/${applicationId}`, { cache: 'no-store' });
          setApplicationValid(applicationResponse.ok);
          if (!applicationResponse.ok) {
            setError('We could not verify this application for payment. Please confirm your application before continuing.');
          }
        }
      } catch {
        setApplicationValid(false);
        setError('Application verification is temporarily unavailable. Please try again.');
      } finally {
        setVerifying(false);
      }
    }

    void verifyApplication();
  }, [applicationId]);

  async function handlePayment() {
    if (!applicationId || !applicationValid) {
      setError('A verified application is required before payment.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/apprenticeship/enroll/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          payment_option: selectedOption,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.checkout_url !== 'string') {
        throw new Error(data.error || 'Unable to create checkout session.');
      }
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout.');
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600 mx-auto mb-4" />
          <p className="text-slate-700">Verifying your application…</p>
        </div>
      </div>
    );
  }

  if (!applicationId || !applicationValid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Enrollment Payment</h1>
          <p className="text-slate-700 mb-6">
            Payment is available after we can verify your application.
          </p>
          {error ? <p role="alert" className="mb-4 text-sm font-medium text-red-700">{error}</p> : null}
          <Link
            href={`/programs/${requestedProgram}/apply`}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-brand-blue-700 hover:bg-brand-blue-800 text-white font-semibold rounded-lg transition"
          >
            Start or Review Application
          </Link>
          <Link href="/programs" className="block mt-3 text-sm text-slate-600 hover:text-slate-900">
            View all programs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Enrollment Payment</h1>
          <p className="text-slate-700">{pricing.name}</p>
        </div>

        {canceled ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-amber-900">
            Checkout was canceled. No new payment was completed.
          </div>
        ) : null}

        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-5 mb-7 text-brand-blue-950">
          Payment does not by itself activate training access. Enrollment approval and any required placement/compliance steps must also be complete.
        </div>

        <div className="space-y-4">
          {options.map((option) => {
            const selected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedOption(option.id)}
                className={`w-full rounded-xl border-2 bg-white p-5 text-left transition ${selected ? 'border-brand-blue-700 ring-2 ring-brand-blue-100' : 'border-slate-200 hover:border-slate-400'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {option.id === 'installment' ? <Calendar className="h-5 w-5 text-brand-blue-700" /> : <CreditCard className="h-5 w-5 text-brand-blue-700" />}
                      <span className="font-bold text-slate-900">{option.label}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{option.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-bold text-slate-900">
                      ${option.amount.toLocaleString(undefined, { minimumFractionDigits: option.id === 'installment' ? 2 : 0, maximumFractionDigits: 2 })}
                    </p>
                    {option.id === 'installment' ? <p className="text-xs text-slate-500">estimated weekly</p> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error ? (
          <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handlePayment}
          disabled={loading}
          className="mt-7 w-full rounded-xl bg-brand-blue-700 py-4 text-lg font-bold text-white hover:bg-brand-blue-800 disabled:opacity-60"
        >
          {loading ? 'Opening secure checkout…' : 'Continue to Secure Checkout'}
        </button>

        <p className="mt-5 text-center text-sm text-slate-600">
          Questions? <Link href="/contact" className="font-semibold text-brand-blue-700 underline">Contact Admissions</Link>.
        </p>
      </div>
    </main>
  );
}
