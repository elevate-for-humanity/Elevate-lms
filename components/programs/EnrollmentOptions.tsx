import Link from 'next/link';
import { BNPL_PROVIDER_SUMMARY } from '@/lib/bnpl-config';

/**
 * EnrollmentOptions — shared two-track enrollment section.
 *
 * Renders a "Workforce-Funded" card and a "Self-Pay" card side by side.
 * Drop into any program page that doesn't use ProgramDetailPage.
 *
 * Props:
 *   slug        — program slug, used to build /apply?program={slug} href
 *   selfPayCost — display string e.g. "$4,200" or "$0 (apprenticeship model)"
 *   selfPayNote — optional override for the self-pay description line
 *   fundedNote  — optional override for the funded description line
 *   applyHref   — override the apply button href (defaults to /apply?program={slug})
 */
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

  return (
    <section className="bg-white border-t border-slate-100 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">
          Enrollment
        </p>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">How to enroll</h2>
        <p className="text-slate-500 text-sm mb-10">
          Two paths — pick the one that fits your situation.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Track 1: Workforce-funded */}
          <div className="rounded-2xl border-2 border-brand-green-400 bg-white shadow-sm p-7 flex flex-col">
            <span className="inline-block bg-brand-green-100 text-brand-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 self-start">
              Workforce Funded
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">
              $0 for eligible participants
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-5 flex-1">
              {fundedNote ??
                'WIOA, Workforce Ready Grant, and  funding may cover 100% of tuition, books, and exam fees for eligible Indiana residents. We help you apply for every option you qualify for.'}
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 text-xs text-slate-600 space-y-1">
              {[
                'WIOA — Federal',
                'Workforce Ready Grant — Indiana',
                ' — SNAP/TANF recipients',
                'Job Ready Indy — Indianapolis',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <Link
              href="/check-eligibility"
              className="block w-full text-center bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              Check My Eligibility
            </Link>
            <p className="text-center text-xs text-slate-400 mt-2">Free · takes 2 minutes</p>
          </div>

          {/* Track 2: Self-pay */}
          <div className="rounded-2xl border-2 border-slate-300 bg-white shadow-sm p-7 flex flex-col">
            <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 self-start">
              Self-Pay · All States
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">{selfPayCost}</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-5 flex-1">
              {selfPayNote ??
                `Enroll immediately without waiting for funding approval. Payment plans, BNPL (${BNPL_PROVIDER_SUMMARY}), and income-share options available.`}
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 text-xs text-slate-600 space-y-1">
              {[
                'Debit / Credit card',
                'ACH bank transfer',
                'Payment plan (split over time)',
                `BNPL — ${BNPL_PROVIDER_SUMMARY}`,
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Link
              href={apply}
              className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              Apply Now
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Not sure which path fits?{' '}
          <Link href="/contact" className="text-brand-red-600 hover:underline font-medium">
            Talk to an advisor
          </Link>{' '}
          — free, 10 minutes.
        </p>
      </div>
    </section>
  );
}
