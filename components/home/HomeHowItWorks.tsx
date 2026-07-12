/**
 * HomeHowItWorks
 *
 * Operational continuity flow: Apply → Funding → Training →
 * Apprenticeship → Credential → Employment.
 * Photo cards replace icon badges — each step has a real image.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { card, layout } from '@/lib/page-design-tokens';

const STEPS = [
  {
    n: '01',
    label: 'Apply',
    detail: 'Complete a short application. No cost, no commitment.',
    href: '/apply',
    img: '/images/pages/apply-page-1.jpg',
    imgAlt: 'Student completing application',
    accent: 'border-brand-red-500',
  },
  {
    n: '02',
    label: 'Funding Review',
    detail: 'We check WIOA, Workforce Ready Grant, and other sources. Most qualify.',
    href: '/check-eligibility',
    img: '/images/pages/funding-impact-1.webp',
    imgAlt: 'Funding advisor reviewing eligibility with student',
    accent: 'border-amber-500',
  },
  {
    n: '03',
    label: 'Training',
    detail: 'Instructor-led, credential-aligned coursework with AI-powered support.',
    href: '/programs',
    img: '/images/pages/comp-pathway-classroom.webp',
    imgAlt: 'Students in workforce training classroom',
    accent: 'border-blue-500',
  },
  {
    n: '04',
    label: 'Apprenticeship',
    detail: 'DOL-registered OJT with employer partners. Hours tracked, wages paid.',
    href: '/apprenticeships',
    img: '/images/pages/apprenticeships-page-1.webp',
    imgAlt: 'Apprentice working on-site with employer supervisor',
    accent: 'border-emerald-500',
  },
  {
    n: '05',
    label: 'Credential',
    detail: 'Industry-recognized certification. Publicly verifiable on our platform.',
    href: '/credentials',
    img: '/images/pages/certifications-page-1.webp',
    imgAlt: 'Graduate receiving industry credential certificate',
    accent: 'border-purple-500',
  },
  {
    n: '06',
    label: 'Employment',
    detail: 'Job placement support, employer connections, and career advancement.',
    href: '/employment-support',
    img: '/images/pages/employment-support-page-1.webp',
    imgAlt: 'Graduate starting new career with employer',
    accent: 'border-brand-green-500',
  },
];

export function HomeHowItWorks() {
  return (
    <section
      className={`bg-slate-950 ${layout.sectionTight} px-4`}
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            The Elevate Pathway
          </p>
          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl font-extrabold text-white mb-3"
          >
            One system. End-to-end.
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            From first application to first paycheck — every step is tracked, funded, and
            supported. No gaps, no handoffs to nowhere.
          </p>
        </div>

        {/* Step grid — 2×3 on desktop so photos stay readable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {STEPS.map((step, i) => (
            <Link
              key={step.n}
              href={step.href}
              className={`group relative flex flex-col rounded-2xl overflow-hidden bg-slate-900 border-t-4 ${step.accent} hover:ring-1 hover:ring-slate-600 transition-all hover:-translate-y-0.5`}
            >
              {/* Photo */}
              <div className={card.programImage}>
                <Image
                  src={step.img}
                  alt={step.imgAlt}
                  fill
                  className={card.programImageFill}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading={i < 2 ? 'eager' : 'lazy'}
                  placeholder="empty"
                />
                <span className="absolute top-2 left-2 text-[10px] font-black text-white bg-slate-900/60 px-1.5 py-0.5 rounded-md">
                  {step.n}
                </span>
              </div>

              {/* Label */}
              <div className="p-3">
                <p className="text-sm font-extrabold text-white leading-tight mb-1">
                  {step.label}
                </p>
                <p className="text-xs text-slate-400 leading-snug">
                  {step.detail}
                </p>
              </div>

              {/* Connector arrow (desktop only) */}
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
          >
            See the full process <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
