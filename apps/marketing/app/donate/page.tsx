'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { LEGAL_PARTNER_LINE } from '@/lib/config/legal-entity';

export const dynamic = 'force-dynamic';

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

export default function DonatePage() {
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [dedication, setDedication] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const finalAmount = customAmount ? Number.parseFloat(customAmount) : amount;

  async function handleDonate() {
    setError('');
    if (!Number.isFinite(finalAmount) || finalAmount < 1) {
      setError('Enter a valid donation amount.');
      return;
    }
    if (!donorEmail.trim()) {
      setError('Enter an email address for the donation receipt.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          recurring,
          donor_name: donorName.trim() || undefined,
          donor_email: donorEmail.trim(),
          dedication: dedication.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to start the donation checkout.');
      if (!data.url) throw new Error('Donation checkout did not return a payment URL.');
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start the donation checkout.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-300">
            <Heart className="h-4 w-4" aria-hidden="true" /> Charitable support
          </div>
          <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">Support Rise Forward Foundation</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Donations submitted through this page are designated for general charitable support of
            {` ${LEGAL_PARTNER_LINE}`}. Funds are administered according to the nonprofit's governing
            documents, available resources, board-authorized purposes, and applicable law.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-bold">Donation disclosure</h2>
              <p className="mt-2 text-sm leading-6">
                A donation does not guarantee that a particular dollar amount will purchase a named
                participant service. It does not guarantee a scholarship, funding award, training
                enrollment, credential, license, exam outcome, employment, wage, placement, or other
                individual result. No unsupported impact multiplier or participant-outcome claim is used
                on this page.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-slate-950">Choose a donation amount</h2>
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {PRESET_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAmount(value);
                    setCustomAmount('');
                  }}
                  aria-pressed={!customAmount && amount === value}
                  className={`rounded-lg border px-3 py-3 text-sm font-bold ${
                    !customAmount && amount === value
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ${value}
                </button>
              ))}
            </div>

            <label className="mt-6 block text-sm font-bold text-slate-800" htmlFor="custom-donation">
              Custom amount
            </label>
            <div className="mt-2 flex items-center rounded-lg border border-slate-300 bg-white px-3">
              <span className="text-slate-500">$</span>
              <input
                id="custom-donation"
                type="number"
                min="1"
                step="0.01"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                className="w-full border-0 px-2 py-3 outline-none"
                placeholder="Other amount"
              />
            </div>

            <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(event) => setRecurring(event.target.checked)}
              />
              Make this a monthly donation
            </label>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-800">
                Name <span className="font-normal text-slate-500">(optional)</span>
                <input
                  type="text"
                  value={donorName}
                  onChange={(event) => setDonorName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-slate-500"
                />
              </label>
              <label className="text-sm font-bold text-slate-800">
                Email
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(event) => setDonorEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-slate-500"
                />
              </label>
            </div>

            <label className="mt-4 block text-sm font-bold text-slate-800">
              Dedication <span className="font-normal text-slate-500">(optional)</span>
              <input
                type="text"
                value={dedication}
                onChange={(event) => setDedication(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-slate-500"
              />
            </label>

            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDonate}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-4 font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Opening secure checkout
                </>
              ) : (
                <>
                  Donate ${Number.isFinite(finalAmount) && finalAmount > 0 ? finalAmount.toFixed(2) : '0.00'}
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Payment processing is handled through Stripe. Review the checkout details before submitting payment.
            </p>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-slate-950">About the nonprofit partner</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Rise Forward Foundation is the public-facing DBA used by Selfish Inc. for community and
              wraparound support described on the Foundation page. Training operations, public workforce
              funding, and charitable support remain separate functions.
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              Tax treatment can depend on the donor's circumstances and applicable law. This website does
              not provide tax advice or promise deductibility of a particular contribution.
            </p>
            <Link href="/rise-forward-foundation" className="mt-6 inline-flex items-center gap-2 font-bold text-emerald-800 hover:underline">
              Review Foundation information <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
