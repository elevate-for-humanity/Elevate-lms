export const dynamic = 'force-dynamic';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Application Submitted | Peer Recovery Specialist',
  robots: { index: false, follow: false },
};

export default function PeerRecoveryApplySuccessPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-100">
          <svg
            className="h-8 w-8 text-brand-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Application Submitted</h1>
        <p className="mt-3 text-black">
          Thank you for applying to the Peer Recovery Specialist program. Our team will contact you
          within 1–2 business days.
        </p>
        <p className="mt-2 text-sm text-black">
          Questions? Call{' '}
          <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="underline">
            {PLATFORM_DEFAULTS.supportPhone}
          </a>
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/programs/peer-recovery-specialist"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
          >
            Back to program
          </Link>
          <Link
            href="/login?redirect=/onboarding/learner"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
