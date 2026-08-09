'use client';

import Link from 'next/link';
import type { FundingType } from '@/lib/programs/program-schema';

interface Props {
  programSlug: string;
  programTitle: string;
  fundingOptions?: FundingType[];
}

const STANDARD_PAYMENT_OPTIONS = [
  { value: 'employer', label: 'Employer Sponsored' },
  { value: 'self-pay', label: 'Self-Pay' },
  { value: 'unsure', label: 'Not Sure Yet' },
];

// Kept as a compatibility export for existing unit tests and callers. The full
// canonical application owns the actual funding selection UI.
export function getProgramPaymentOptions(fundingOptions: FundingType[] = []) {
  return [
    ...(fundingOptions.includes('wioa') ? [{ value: 'wioa', label: 'WIOA / WorkOne' }] : []),
    ...(fundingOptions.includes('wrg') ? [{ value: 'wrg', label: 'Workforce Ready Grant' }] : []),
    ...STANDARD_PAYMENT_OPTIONS,
  ];
}

export default function ProgramApplyForm({ programSlug, programTitle }: Props) {
  const applicationHref = `/apply/student?program=${encodeURIComponent(programSlug)}`;

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby={`apply-${programSlug}`}
    >
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">
        Application
      </p>
      <h2 id={`apply-${programSlug}`} className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
        Apply for {programTitle}
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
        Complete one application record for contact information, program selection, funding,
        background questions, support needs, acknowledgements, and program-specific documents.
      </p>

      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        <strong>Identity verification is required before enrollment.</strong> After your application
        creates your secure student account, you will verify your Social Security number and upload
        your government-issued photo ID through the protected onboarding workflow. SSNs are never
        stored in the general application record.
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={applicationHref}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white hover:bg-brand-red-700"
        >
          Start Full Application
        </Link>
        <Link
          href="/apply/track"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50"
        >
          Track Existing Application
        </Link>
      </div>
    </section>
  );
}
