import Link from 'next/link';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { resolveProgramFundingStatus } from '@/lib/programs/funding-visibility';
import { ICC_URL, ICC_INSTRUCTION } from '@/lib/page-design-tokens';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import WorkforceFundingIntakeCallout from './WorkforceFundingIntakeCallout';

type Props = {
  program: ProgramSchema;
};

export default function ProgramFundingProcessSection({ program }: Props) {
  const funding = resolveProgramFundingStatus(program);
  const careerConnectHref = program.cta?.careerConnectHref || ICC_URL;
  const selfPayCost = program.selfPayCost?.trim();

  return (
    <section className="py-12 sm:py-16 bg-slate-50 border-t border-slate-100" id="funding">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green-600 mb-2">
            Funding &amp; How to Start
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">{funding.fundabilityHeadline}</h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-3xl mx-auto">
            {funding.fundabilitySummary}
          </p>
          {funding.fundingSourceLabels.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {funding.fundingSourceLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center bg-brand-green-50 text-brand-green-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-green-200"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Is this program fundable?
            </p>
            <h3 className="text-lg font-extrabold text-slate-900 mb-3">
              {funding.showWorkforceFundingProcess
                ? 'Yes — for eligible Indiana residents'
                : funding.isImpactFundable
                  ? 'IMPACT only — not WIOA / ETPL tuition'
                  : 'Self-pay pathway'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              {funding.showWorkforceFundingProcess ? (
                <>
                  Federal and state workforce programs may cover tuition, tools, and certification
                  fees when you are approved. Eligibility is decided by{' '}
                  <strong>WorkOne</strong> or your workforce agency — not by {PLATFORM_DEFAULTS.orgName}.
                </>
              ) : funding.isImpactFundable ? (
                <>
                  This program is not on Indiana&apos;s ETPL for WIOA tuition. Indiana SNAP or TANF
                  recipients may still qualify through <strong>FSSA IMPACT</strong> with a case-worker
                  referral.
                </>
              ) : (
                <>
                  Workforce vouchers (WIOA / WRG) do not apply to this short program. You may still
                  enroll through self-pay, payment plans, BNPL, or employer sponsorship.
                </>
              )}
            </p>
            {selfPayCost && (
              <p className="text-slate-700 text-sm">
                <span className="font-semibold">Self-pay option:</span> {selfPayCost}
                {program.paymentTerms ? ` — ${program.paymentTerms}` : ''}
              </p>
            )}
            <Link
              href="/funding/how-it-works"
              className="inline-block mt-4 text-brand-blue-600 font-semibold text-sm hover:underline"
            >
              How workforce funding works →
            </Link>
          </div>

          {funding.showWorkforceFundingProcess ? (
            <div className="bg-brand-blue-50 rounded-xl border border-brand-blue-200 p-6">
              <p className="text-brand-blue-900 font-semibold text-sm mb-1">Indiana Career Connect</p>
              <p className="text-brand-blue-800 text-sm leading-relaxed mb-4">{ICC_INSTRUCTION}</p>
              <a
                href={careerConnectHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Go to Indiana Career Connect
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-slate-900 font-semibold text-sm mb-2">Ready to enroll?</p>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Talk to an advisor about self-pay, payment plans, or employer sponsorship. No
                WorkOne intake is required for this pathway.
              </p>
              <Link
                href={program.cta?.applyHref || `/apply?program=${program.slug}`}
                className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Apply Now
              </Link>
            </div>
          )}
        </div>

        {funding.showWorkforceFundingProcess && (
          <WorkforceFundingIntakeCallout
            careerConnectHref={careerConnectHref}
            className="mt-8"
            showIntroCards={false}
          />
        )}

        {funding.isImpactFundable && !funding.showWorkforceFundingProcess && (
          <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6 text-sm text-purple-900">
            <p className="font-bold mb-2">FSSA IMPACT pathway (Indiana only)</p>
            <p className="text-purple-800 leading-relaxed">
              Contact your FSSA or DFR case worker to request a training referral. IMPACT does not
              use the WorkOne WIOA intake form. Self-pay enrollment remains open to all states.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
