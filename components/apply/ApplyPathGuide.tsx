import Link from 'next/link';

type Variant = 'hub' | 'student';

/**
 * Clarifies the two student application paths (/apply quick intake vs /apply/student full form).
 */
export default function ApplyPathGuide({ variant }: { variant: Variant }) {
  const isHub = variant === 'hub';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6 mb-8">
      <h2 className="text-lg font-bold text-slate-900 mb-2">Which application should I use?</h2>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div
          className={`rounded-lg border p-4 bg-white ${isHub ? 'border-brand-red-300 ring-1 ring-brand-red-200' : 'border-slate-200'}`}
        >
          <p className="font-semibold text-slate-900 mb-1">Quick eligibility check (3–5 min)</p>
          <p className="text-slate-600 mb-3">
            Best when you want funding screening first (WIOA, WRG, FSSA) before choosing a program.
          </p>
          {isHub ? (
            <span className="text-brand-red-600 font-semibold">You are here</span>
          ) : (
            <Link href="/apply" className="text-brand-red-600 font-semibold hover:underline">
              Go to quick intake →
            </Link>
          )}
        </div>
        <div
          className={`rounded-lg border p-4 bg-white ${!isHub ? 'border-brand-red-300 ring-1 ring-brand-red-200' : 'border-slate-200'}`}
        >
          <p className="font-semibold text-slate-900 mb-1">Full student application (~10 min)</p>
          <p className="text-slate-600 mb-3">
            Best when you know your program and want to provide enrollment, funding, background,
            support-needs, and apprenticeship transfer-hour evidence when applicable.
          </p>
          {!isHub ? (
            <span className="text-brand-red-600 font-semibold">You are here</span>
          ) : (
            <Link href="/apply/student" className="text-brand-red-600 font-semibold hover:underline">
              Start full application →
            </Link>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-4">
        Apprenticeship programs (barber, cosmetology, esthetician, nail) may also use dedicated apply
        pages linked from each program. Required program-specific documents are collected in the
        applicable application or onboarding step and routed to review before credit or approval is granted.
      </p>
    </div>
  );
}
