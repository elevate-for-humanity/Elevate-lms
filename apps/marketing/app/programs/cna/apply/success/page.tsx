export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { canonicalRoutes } from '@/lib/routes/canonical-routes';
import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: "You're In — CNA Program",
  robots: { index: false, follow: false },
};

export default function CNAApplySuccessPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
      <div className="mx-auto max-w-md text-center">
        {/* Check mark */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-100">
          <svg
            className="h-8 w-8 text-brand-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          You&rsquo;re In &mdash; Next Step
        </h1>

        <p className="text-xl text-slate-600 mb-6">Check your phone.</p>

        <p className="text-slate-700 mb-3">We&rsquo;re going to reach out to help you:</p>

        <ul className="text-left inline-block space-y-2 mb-8 text-slate-700">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-brand-green-500 font-bold" aria-hidden="true">
              ✓
            </span>
            Confirm your eligibility
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-brand-green-500 font-bold" aria-hidden="true">
              ✓
            </span>
            Walk you through funding options
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-brand-green-500 font-bold" aria-hidden="true">
              ✓
            </span>
            Get you enrolled
          </li>
        </ul>

        <p className="text-sm text-slate-500 mb-6">Ready to move faster? Call or text us now.</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
            className="rounded-xl bg-brand-blue-700 px-6 py-3.5 font-semibold text-white hover:bg-brand-blue-800 transition-colors"
          >
            Call Now &mdash; {PLATFORM_DEFAULTS.supportPhone}
          </a>
          <a
            href="sms:3173143757"
            className="rounded-xl border-2 border-brand-blue-700 px-6 py-3.5 font-semibold text-brand-blue-700 hover:bg-brand-blue-50 transition-colors"
          >
            Text Us &mdash; {PLATFORM_DEFAULTS.supportPhone}
          </a>
        </div>

        <p className="mt-10 text-xs text-slate-400">
          <Link
            href={canonicalRoutes.programs.certifiedNursingAssistant}
            className="underline hover:text-slate-600"
          >
            ← Back to CNA program
          </Link>
        </p>
      </div>
    </main>
  );
}
