/**
 * HomeFundingStrip — compact funding pathway links directly below hero/marquee.
 * Answers "Can I get this paid for?" above the fold.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const FUNDING_PATHS = [
  { label: 'WIOA', desc: 'Federal tuition', href: '/funding/wioa' },
  { label: 'Workforce Ready Grant', desc: 'Indiana state', href: '/funding/wrg' },
  { label: 'SNAP E&T', desc: 'Training support', href: '/snap-et-partner' },
  { label: 'State funding hub', desc: 'WRG, JRI, WIOA', href: '/funding' },
  { label: 'Earn While You Learn', desc: 'Apprenticeship', href: '/programs/apprenticeships' },
];

export function HomeFundingStrip() {
  return (
    <section
      className="bg-brand-blue-700 text-white py-6 px-4"
      aria-labelledby="funding-strip-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 id="funding-strip-heading" className="text-lg font-extrabold">
              Can training be paid for?
            </h2>
            <p className="text-brand-blue-100 text-sm mt-0.5">
              Most eligible learners qualify for $0 tuition through workforce funding.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/find-workone"
              className="inline-flex items-center gap-1.5 text-sm font-bold border border-white/40 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Find WorkOne <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/funding"
              className="inline-flex items-center gap-1.5 text-sm font-bold bg-white text-brand-blue-800 px-4 py-2 rounded-lg hover:bg-brand-blue-50 transition-colors"
            >
              All funding options <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {FUNDING_PATHS.map((path) => (
            <Link
              key={path.label}
              href={path.href}
              className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-2.5 transition-colors"
            >
              <p className="text-sm font-bold leading-tight">{path.label}</p>
              <p className="text-[11px] text-brand-blue-100 mt-0.5">{path.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
