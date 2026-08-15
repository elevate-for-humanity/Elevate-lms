import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { ACTIVE_PROVIDERS } from '@/lib/testing/proctoring-capabilities';
import TestingCheckoutClient from './TestingCheckoutClient';

export const metadata: Metadata = {
  title: 'Choose Exam & Checkout | Elevate Testing Center',
  description:
    'Select an available exam, review the exact configured retail total, and continue to secure Stripe Checkout.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing/checkout' },
};

function examAmountCents(
  provider: (typeof ACTIVE_PROVIDERS)[number],
  exam: (typeof ACTIVE_PROVIDERS)[number]['exams'][number],
): number | null {
  if (typeof exam === 'object' && exam.amountCents && exam.amountCents > 0) return exam.amountCents;
  if (provider.fees?.length === 1 && provider.fees[0].amount > 0) {
    return Math.round(provider.fees[0].amount * 100);
  }
  return null;
}

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
    exams: provider.exams
      .map((exam) => ({
        name: typeof exam === 'string' ? exam : exam.name,
        description: typeof exam === 'string' ? '' : exam.description || '',
        durationMinutes: typeof exam === 'string' ? null : exam.durationMinutes || null,
        amountCents: examAmountCents(provider, exam),
      }))
      .filter((exam) => Boolean(exam.amountCents && exam.amountCents > 0)),
    addOn: provider.addOn
      ? {
          label: provider.addOn.label,
          description: provider.addOn.description,
          amountCents: provider.addOn.amountCents,
          includes: provider.addOn.includes,
        }
      : null,
  })).filter((provider) => provider.exams.length > 0);

  return (
    <main className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link
          href="/testing"
          className="inline-flex items-center gap-2 text-base font-bold text-slate-700 hover:text-brand-red-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Testing
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
                Server-authoritative checkout
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                Choose the exact exam you are taking.
              </h1>
              <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
                Every exam shown here has a positive configured retail amount in the canonical testing registry.
                The server re-resolves that amount before it creates Stripe Checkout, so the browser cannot set the price.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <TestingCheckoutClient
            providers={providers}
            initialProvider={
              providers.some((provider) => provider.key === selectedProvider) ? selectedProvider : ''
            }
            initialExam={selectedExam}
          />
        </div>
      </div>
    </main>
  );
}
