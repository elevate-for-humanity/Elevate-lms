import Link from 'next/link';

type Variant = 'hub' | 'student';

/**
 * Canonical student-application guidance.
 *
 * Historical /apply quick intake was removed because it created a second,
 * partial student application. Keep this component API-compatible while making
 * the full application + secure identity sequence explicit.
 */
export default function ApplyPathGuide({ variant: _variant }: { variant: Variant }) {
  return (
    <div className="mb-8 rounded-xl border border-slate-300 bg-slate-50 p-5 sm:p-6">
      <h2 className="text-lg font-black text-slate-950">Complete application and enrollment requirements</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-bold text-slate-950">1. Full student application</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Provide legal contact information, program selection, funding, education/background,
            support needs, required acknowledgements, and apprenticeship transfer-hour evidence when applicable.
          </p>
        </div>
        <div className="rounded-xl border border-blue-300 bg-blue-50 p-4">
          <p className="font-bold text-blue-950">2. Secure identity verification before enrollment</p>
          <p className="mt-2 text-sm leading-6 text-blue-950">
            Your student account must verify your complete Social Security number and government-issued
            photo ID (front/back as applicable) plus a current selfie. The full SSN is never stored in the
            general application record; the protected identity service stores only its hash and last four.
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold leading-5 text-slate-700">
        Host shops/employers do not use the student form. They use the separate{' '}
        <Link href="/partners/host-shop/apply" className="font-bold text-brand-blue-700 hover:underline">
          Host Site compliance application
        </Link>
        .
      </p>
    </div>
  );
}
