import Link from 'next/link';
import { BNPL_PROVIDER_SUMMARY } from '@/lib/bnpl-config';
import {
  getPublicFundingDisclosure,
  getPublicFundingLabels,
  getVerifiedProgramFunding,
} from '@/lib/programs/funding-registry';

export interface EnrollmentOptionsProps {
  slug: string;
  selfPayCost: string;
  selfPayNote?: string;
  fundedNote?: string;
  applyHref?: string;
}

export default function EnrollmentOptions({
  slug,
  selfPayCost,
  selfPayNote,
  fundedNote,
  applyHref,
}: EnrollmentOptionsProps) {
  const apply = applyHref ?? `/apply?program=${slug}`;
  const verifiedFunding = getVerifiedProgramFunding(slug);
  const fundingLabels = getPublicFundingLabels(slug);

  return (
    <section className="bg-white border-t border-slate-100 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Enrollment</p>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">How to enroll</h2>
        <p className="text-slate-500 text-sm mb-10">
          Use the payment or funding pathway that is actually documented for this program and participant.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border-2 border-slate-300 bg-white shadow-sm p-7 flex flex-col">
            <span className="inline-block bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 self-start">
              Third-party funding review
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              {verifiedFunding ? 'Verified program funding pathway' : 'No public workforce-funding claim for this program'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-5 flex-1">
              {verifiedFunding
                ? fundedNote ?? getPublicFundingDisclosure(slug)
                : 'This program is not in Elevate’s canonical public workforce-funding registry. Do not represent WIOA, Workforce Ready Grant, or another public source as approved unless program-level evidence is verified and the responsible agency authorizes this participant.'}
            </p>

            {fundingLabels.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 mb-5 text-xs text-slate-600 space-y-2">
                {fundingLabels.map((label) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 shrink-0" />
                    {label} — program-level public claim verified; participant authorization still required
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/funding"
              className="block w-full text-center border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              Review Funding Requirements
            </Link>
          </div>

          <div className="rounded-2xl border-2 border-slate-300 bg-white shadow-sm p-7 flex flex-col">
            <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 self-start">
              Self-Pay
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">{selfPayCost}</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-5 flex-1">
              {selfPayNote ??
                `Review the current enrollment agreement before payment. Any installment or BNPL option (${BNPL_PROVIDER_SUMMARY}) is subject to its current provider terms and approval requirements.`}
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 text-xs text-slate-600 space-y-2">
              <div>Published program price must match the current program record.</div>
              <div>Enrollment agreement controls actual charges and refund terms.</div>
              <div>Financing or employer payment is not guaranteed.</div>
            </div>
            <Link
              href={apply}
              className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              Start Application
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Need help identifying the controlling program record?{' '}
          <Link href="/contact" className="text-brand-red-600 hover:underline font-medium">
            Contact admissions
          </Link>.
        </p>
      </div>
    </section>
  );
}
