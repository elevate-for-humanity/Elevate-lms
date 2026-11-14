import Link from 'next/link';
import { ICC_URL, ICC_INSTRUCTION } from '@/lib/page-design-tokens';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const STEPS = [
  {
    title: 'Start online at Indiana Career Connect',
    detail: `Create or sign in at Indiana Career Connect and search for "${PLATFORM_DEFAULTS.orgName}" as your training provider.`,
  },
  {
    title: 'Or visit your nearest WorkOne career center',
    detail:
      'WorkOne staff complete the WIOA and Workforce Ready Grant eligibility assessment. Funding approval happens at WorkOne — not at your training school.',
  },
  {
    title: 'Complete eligibility with a WorkOne case manager',
    detail:
      'Bring ID and employment history. Your case manager determines whether you qualify for an Individual Training Account (ITA) voucher.',
  },
  {
    title: 'Enroll after your training voucher is approved',
    detail:
      'Return to Elevate with your WorkOne authorization to finish enrollment. Approved students often pay $0 for tuition and certification fees.',
  },
] as const;

type Props = {
  programTitle?: string;
  careerConnectHref?: string;
  className?: string;
  /** When false, only the numbered steps and action buttons render. */
  showIntroCards?: boolean;
};

/** Shared WIOA / ETPL intake steps — Indiana Career Connect online or nearest WorkOne. */
export default function WorkforceFundingIntakeCallout({
  programTitle,
  careerConnectHref = ICC_URL,
  className = '',
  showIntroCards = true,
}: Props) {
  return (
    <div className={className}>
      {showIntroCards && (
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
            Workforce funding
          </p>
          <h3 className="text-lg font-extrabold text-slate-900 mb-3">
            {programTitle ? `${programTitle} may be fundable` : 'This program may be fundable'}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Eligible Indiana residents may qualify for WIOA or Workforce Ready Grant funding.
            Eligibility is determined through WorkOne or Indiana Career Connect — not by{' '}
            {PLATFORM_DEFAULTS.orgName}.
          </p>
        </div>
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
      </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-extrabold text-slate-900 mb-2">How to start the funding process</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Go to <strong>Indiana Career Connect online</strong> or visit your{' '}
          <strong>nearest WorkOne career center</strong> to begin eligibility intake.
        </p>
        <ol className="space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="bg-brand-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{step.title}</p>
                <p className="text-slate-600 text-sm leading-relaxed mt-0.5">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href={careerConnectHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Indiana Career Connect (online)
          </a>
          <Link
            href="/find-workone"
            className="inline-flex items-center justify-center border-2 border-slate-300 hover:border-brand-blue-400 text-slate-800 font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Find nearest WorkOne center
          </Link>
        </div>
      </div>
    </div>
  );
}
