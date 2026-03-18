import Link from 'next/link';
import { ICC_URL, ICC_INSTRUCTION } from '@/lib/page-design-tokens';

/**
 * FundingBlock — locked funding + Indiana Career Connect section.
 *
 * Use on every student-facing program page that has WIOA/apprenticeship eligibility.
 * Explains funding sources, BNPL, and ICC pathway clearly.
 */
interface FundingBlockProps {
  showBNPL?: boolean;
  outOfState?: boolean;
}

export default function FundingBlock({ showBNPL = true, outOfState = true }: FundingBlockProps) {
  return (
    <section className="py-12 sm:py-16 bg-slate-50 border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Funding explanation */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Funding & Payment
            </p>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">
              How Training Gets Paid For
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              Federal and state funding may cover tuition, tools, and certification fees for
              eligible Indiana residents. Eligibility is determined through WorkOne — not Elevate.
            </p>
            {outOfState && (
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Students from outside Indiana may still enroll through self-pay options.
              </p>
            )}
            {showBNPL && (
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Students who do not qualify for funding can enroll through flexible payment plans
                and buy-now-pay-later options.
              </p>
            )}
            <Link
              href="/funding"
              className="inline-block text-brand-blue-600 font-semibold text-sm hover:underline"
            >
              Explore all funding options →
            </Link>
          </div>

          {/* Indiana Career Connect */}
          <div className="bg-brand-blue-50 rounded-xl border border-brand-blue-200 p-6">
            <p className="text-brand-blue-900 font-semibold text-sm mb-1">
              Indiana Career Connect
            </p>
            <p className="text-brand-blue-800 text-sm leading-relaxed mb-4">
              {ICC_INSTRUCTION}
            </p>
            <a
              href={ICC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Go to Indiana Career Connect
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
