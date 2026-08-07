import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { ACTIVE_PROVIDERS } from '@/lib/testing/proctoring-capabilities';
import TestingCheckoutClient from './TestingCheckoutClient';

export const metadata: Metadata = {
  title: 'Choose Exam & Checkout | Elevate Testing Center',
  description: 'Select an individual credential exam, review exact pricing and optional add-ons, then continue to secure Stripe Checkout.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing/checkout' },
};

export default async function TestingCheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ provider?: string; exam?: string; exam_name?: string }>;
}) {
  const params = await searchParams;
  const selectedProvider = params?.provider || '';
  const selectedExam = params?.exam_name || params?.exam || '';

  const providers = ACTIVE_PROVIDERS.map((provider) => ({
    key: provider.key,
    name: provider.name,
    exams: provider.exams.map((exam) => ({
      name: typeof exam === 'string' ? exam : exam.name,
      description: typeof exam === 'string' ? '' : exam.description || '',
      durationMinutes: typeof exam === 'string' ? null : exam.durationMinutes || null,
      amountCents:
        typeof exam === 'object' && exam.amountCents
          ? exam.amountCents
          : provider.fees?.length === 1
            ? Math.round(provider.fees[0].amount * 100)
            : null,
    })),
    addOn: provider.addOn
      ? {
          label: provider.addOn.label,
          description: provider.addOn.description,
          amountCents: provider.addOn.amountCents,
          includes: provider.addOn.includes,
        }
      : null,
  }));

  return (
    <main className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link href="/testing" className="inline-flex items-center gap-2 text-base font-bold text-slate-700 hover:text-brand-red-700">
          <ArrowLeft className="h-4 w-4" /> Back to Testing
        </Link>

        <div className="mt-6 rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-300">Secure Exam Checkout</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">Choose the exact exam you are taking.</h1>
              <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-300">
                Individual exam prices come from the testing-provider configuration in Elevate. Optional add-ons are priced separately. Stripe calculates any eligible BNPL options and accepts active promotion codes at checkout.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <TestingCheckoutClient
            providers={providers}
            initialProvider={selectedProvider}
            initialExam={selectedExam}
          />
        </div>
      </div>
    </main>
  );
}
