/**
 * HomeSegmentedCTA
 *
 * Separate journey entry points for each audience segment.
 * Each card routes into its own funnel with distinct value props.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const SEGMENTS = [
  {
    audience: 'Learners',
    headline: 'Start your career path',
    desc: 'Get trained, credentialed, and placed — often at $0 through WIOA or state funding.',
    cta: 'Apply Now',
    href: '/apply',
    secondaryCta: 'Check Eligibility',
    secondaryHref: '/check-eligibility',
    img: '/images/pages/for-students-hero.webp',
    alt: 'Student in workforce training program',
    badge: 'Most popular',
    badgeColor: 'bg-brand-red-600 text-white',
    accent: 'border-brand-red-200 hover:border-brand-red-400',
    ctaStyle: 'bg-brand-red-600 hover:bg-brand-red-700 text-white',
  },
  {
    audience: 'Employers',
    headline: 'Hire, train, and retain',
    desc: 'Access pre-credentialed graduates, sponsor apprentices, and receive OJT wage reimbursement.',
    cta: 'Employer Info',
    href: '/for-employers',
    secondaryCta: 'Post a Role',
    secondaryHref: '/hire-graduates',
    img: '/images/pages/employer-handshake.webp',
    alt: 'Employer hiring program graduates',
    badge: 'Hiring incentives',
    badgeColor: 'bg-blue-600 text-white',
    accent: 'border-blue-200 hover:border-blue-400',
    ctaStyle: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    audience: 'Workforce Agencies',
    headline: 'Refer and track participants',
    desc: 'Case managers and WorkOne staff — refer participants, track WIOA outcomes, and document compliance.',
    cta: 'Agency Tools',
    href: '/for-agencies',
    secondaryCta: 'Submit Referral',
    secondaryHref: '/agency-referral-workforce-training-indiana',
    img: '/images/pages/workforce-board-page-1.webp',
    alt: 'Workforce agency case manager with participant',
    badge: 'WIOA aligned',
    badgeColor: 'bg-emerald-700 text-white',
    accent: 'border-emerald-200 hover:border-emerald-400',
    ctaStyle: 'bg-emerald-700 hover:bg-emerald-800 text-white',
  },
  {
    audience: 'Training Partners',
    headline: 'Expand your reach',
    desc: 'Training providers and credential issuers — partner with us to access funding pipelines and workforce infrastructure.',
    cta: 'Partner With Us',
    href: '/for-providers',
    secondaryCta: 'Learn More',
    secondaryHref: '/partnerships',
    img: '/images/pages/about-partners-hero.webp',
    alt: 'Training provider partner',
    badge: null,
    badgeColor: '',
    accent: 'border-purple-200 hover:border-purple-400',
    ctaStyle: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
];

export function HomeSegmentedCTA() {
  return (
    <section
      className="bg-white py-12 sm:py-16 px-4 border-b border-slate-100"
      aria-labelledby="segments-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">
            Who Is This For?
          </p>
          <h2
            id="segments-heading"
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3"
          >
            Find your path in 10 seconds.
          </h2>
          <p className="text-slate-600 text-sm max-w-lg mx-auto">
            Tell us where you are and we&apos;ll show you exactly what to do next.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SEGMENTS.map((seg) => (
            <div
              key={seg.audience}
              className={`group flex flex-col rounded-2xl border bg-white overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ${seg.accent}`}
            >
              {/* Photo */}
              <div className="relative w-full aspect-[2/1] max-h-36 lg:max-h-36 overflow-hidden bg-slate-100">
                <Image
                  src={seg.img}
                  alt={seg.alt}
                  fill
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  loading="lazy"
                  placeholder="empty"
                />
                {seg.badge && (
                  <span
                    className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${seg.badgeColor}`}
                  >
                    {seg.badge}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-4 gap-3">
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                  {seg.audience}
                </p>
                <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                  {seg.headline}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed flex-1">{seg.desc}</p>

                <div className="flex flex-col gap-2 mt-1">
                  <Link
                    href={seg.href}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${seg.ctaStyle}`}
                  >
                    {seg.cta} <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href={seg.secondaryHref}
                    className="flex items-center justify-center py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    {seg.secondaryCta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
