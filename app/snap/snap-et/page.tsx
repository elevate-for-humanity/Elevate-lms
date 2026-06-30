export const dynamic = 'force-dynamic';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'SNAP E&T Partner',
  description:
    `${PLATFORM_DEFAULTS.orgName} SNAP Employment & Training partner information for agencies and case managers.`,
  robots: { index: false, follow: false },
};

export default function SnapEtPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
            SNAP Employment & Training
          </p>
          <h1 className="text-4xl font-extrabold mb-4">SNAP E&T Program Information</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            {PLATFORM_DEFAULTS.orgName} participates in Indiana SNAP Employment & Training pathways and
            provides credential-focused workforce training and placement support.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto grid gap-4 sm:grid-cols-2">
          <Link
            href="/contact"
            className="rounded-xl border border-slate-200 p-6 hover:border-brand-blue-300 hover:bg-slate-50 transition"
          >
            <h2 className="font-bold text-slate-900">Agency Partnership</h2>
            <p className="text-sm text-slate-600 mt-2">
              Contact us to coordinate SNAP E&T referral and partnership workflows.
            </p>
          </Link>
          <Link
            href="/funding"
            className="rounded-xl border border-slate-200 p-6 hover:border-brand-blue-300 hover:bg-slate-50 transition"
          >
            <h2 className="font-bold text-slate-900">Funding Overview</h2>
            <p className="text-sm text-slate-600 mt-2">
              Review available learner funding pathways and eligibility requirements.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
