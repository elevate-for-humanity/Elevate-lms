import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Thank You | Rise Forward Foundation',
  description: 'Donation confirmation for Rise Forward Foundation.',
  robots: { index: false, follow: false },
};

export default function DonationThankYouPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-20">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-black text-slate-950">Thank you for your support.</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Your checkout was completed through Stripe for Selfish Inc. d/b/a Rise Forward Foundation. Please retain the payment confirmation or receipt provided through the checkout process for your records.
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          This confirmation does not assign your gift to a specific participant, credential, job outcome, or public-funding program unless a separate written designation was accepted by the Foundation.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/rise-forward-foundation" className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800">
            Foundation Information
          </Link>
          <Link href="/" className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
            Return Home
          </Link>
        </div>
      </section>
    </main>
  );
}
