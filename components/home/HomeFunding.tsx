/**
 * HomeFunding
 *
 * Funding accessibility section - WIOA, Workforce Ready Grant,
 * employer reimbursement, payment assistance.
 * Messaging: "Most learners qualify."
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const FUNDING_SOURCES = [
  {
    name: 'WIOA',
    full: 'Workforce Innovation & Opportunity Act',
    desc: 'Federal funding for eligible job seekers. Covers tuition, books, and exam fees.',
    badge: 'Federal',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Workforce Ready Grant',
    full: 'Indiana Next Level Jobs',
    desc: 'State grant for high-demand credentials. No repayment required.',
    badge: 'Indiana',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    name: 'FSSA IMPACT',
    full: 'Family & Social Services Administration',
    desc: 'Training support for SNAP and TANF participants.',
    badge: 'State',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: 'Job Ready Indy',
    full: 'Marion County Workforce Initiative',
    desc: 'Local funding for Indianapolis-area residents in priority sectors.',
    badge: 'Local',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    name: 'OJT Reimbursement',
    full: 'On-the-Job Training',
    desc: 'Employers receive up to 50% wage reimbursement during apprenticeship.',
    badge: 'Employer',
    badgeColor: 'bg-slate-100 text-slate-700',
  },
  {
    name: 'Payment Plans',
    full: 'Self-Pay Assistance',
    desc: 'Flexible payment options for those who don\'t qualify for grant funding.',
    badge: 'Self-Pay',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
];

export function HomeFunding() {
  return (
    <section
      className="bg-white py-16 px-4 border-t border-slate-100"
      aria-labelledby="funding-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">
              Funding & Accessibility
            </p>
            <h2
              id="funding-heading"
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4"
            >
              Most learners pay $0.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-lg">
              WIOA, state grants, and employer reimbursement programs cover tuition, books,
              and exam fees for most eligible Indiana residents. We handle the paperwork -
              you focus on training.
            </p>

            {/* Funding source grid */}
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {FUNDING_SOURCES.map((f) => (
                <div
                  key={f.name}
                  className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{f.name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${f.badgeColor}`}>
                      {f.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/check-eligibility"
                className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-sm px-6 py-3 rounded-lg transition-colors"
              >
                Check My Eligibility <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/funding"
                className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
              >
                Learn about funding options
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-600">
              Eligibility varies by program and funding source. Check in 2 minutes - no commitment.
            </p>
          </div>

          {/* Right: image */}
          <div className="relative h-56 lg:h-64 rounded-2xl overflow-hidden">
            <Image
              src="/images/pages/funding-impact-1.webp"
              alt="Funding advisor helping a student navigate WIOA eligibility"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
              placeholder="empty"
            />
            {/* Overlay callout */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <p className="text-xs font-bold text-slate-900 mb-0.5">
                  Free eligibility check
                </p>
                <p className="text-[11px] text-slate-500">
                  Takes 2 minutes. No commitment. We&apos;ll tell you exactly what you qualify for.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
