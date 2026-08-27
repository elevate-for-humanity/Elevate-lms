/**
 * EnrollmentPipeline
 *
 * Visual Apply → Approved → Enrolled → Trained → Placed pipeline.
 * Used on program pages, intake form, and confirmation screen.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const STEPS = [
  { label: 'Apply',    desc: '2–3 min form' },
  { label: 'Approved', desc: '24–48 hrs' },
  { label: 'Enrolled', desc: 'Advisor call' },
  { label: 'Trained',  desc: 'Program runs' },
  { label: 'Placed',   desc: 'Career launch' },
];

interface Props {
  applyHref?: string;
  /** Highlight a specific step (0-based). Default: none highlighted. */
  activeIndex?: number;
  /** Show the Apply CTA button below the pipeline. */
  showCta?: boolean;
  className?: string;
}

export default function EnrollmentPipeline({
  applyHref = '/apply/intake',
  activeIndex,
  showCta = true,
  className = '',
}: Props) {
  return (
    <div className={`bg-slate-900 rounded-2xl px-6 py-8 ${className}`}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
        Your path from application to career
      </p>

      {/* Pipeline steps */}
      <div
        className="flex items-start overflow-x-auto pb-2 gap-0"
        role="region"
        aria-label="Enrollment steps"
        tabIndex={0}
      >
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  activeIndex !== undefined && i < activeIndex
                    ? 'bg-brand-green-500 border-brand-green-500 text-white'
                    : activeIndex !== undefined && i === activeIndex
                    ? 'bg-brand-red-600 border-brand-red-600 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}
              >
                {activeIndex !== undefined && i < activeIndex ? '✓' : i + 1}
              </div>
              <p className="text-xs font-semibold text-white mt-2 text-center">{step.label}</p>
              <p className="text-xs text-slate-400 text-center max-w-7xl leading-tight">{step.desc}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-shrink-0 mx-1 mt-[-20px]">
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      {showCta && (
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link
            href={applyHref}
            className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Check Eligibility &amp; Apply
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-slate-400">
            Takes 2–3 minutes · No commitment · Funding reviewed after submission
          </p>
        </div>
      )}
    </div>
  );
}
