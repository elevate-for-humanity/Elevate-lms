/**
 * Learner + employer apprenticeship infrastructure (shared on home and /apprenticeships).
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { card, hero, layout, type } from '@/lib/page-design-tokens';

const bulletDot = 'w-1.5 h-1.5 rounded-full bg-brand-red-500 mt-2 shrink-0';

const EMPLOYER_CAPABILITIES = [
  'DOL-registered apprenticeship sponsorship',
  'OJT wage reimbursement up to 50%',
  'RAPIDS-compatible hour tracking',
  'Employer dashboard with live cohort visibility',
  'WEX and OJT agreement management',
  'WOTC tax credit documentation',
  'Compliance reporting for workforce boards',
];

const LEARNER_CAPABILITIES = [
  'Earn wages while you train',
  'Hours tracked automatically — no paperwork',
  'Geofenced check-in at employer sites',
  'Apprenticeship progress visible in your portal',
  'Credential issued on completion, publicly verifiable',
  'Pathway to journeyman status and wage increases',
];

export interface ApprenticeshipInfraSectionProps {
  /** Tighter vertical rhythm when embedded on the home page */
  variant?: 'default' | 'compact';
  showSectionIntro?: boolean;
}

export function ApprenticeshipInfraSection({
  variant = 'default',
  showSectionIntro = true,
}: ApprenticeshipInfraSectionProps) {
  const sectionPad = variant === 'compact' ? layout.sectionTight : layout.section;

  return (
    <section
      className={`bg-slate-50 ${sectionPad} px-4 border-t border-slate-100`}
      aria-labelledby="apprenticeship-infra-heading"
    >
      <div className={layout.container}>
        {showSectionIntro ? (
          <div className="text-center mb-8 sm:mb-10">
            <p className={type.eyebrow}>Apprenticeship Infrastructure</p>
            <h2 id="apprenticeship-infra-heading" className={`${type.h2} mt-2 mb-2`}>
              Real apprenticeships. Real oversight.
            </h2>
            <p className={`${type.bodySmall} max-w-2xl mx-auto`}>
              Elevate is a DOL-registered apprenticeship sponsor. Structured OJT, employer coordination,
              RAPIDS-compatible tracking, and compliance documentation — so employers and learners can focus
              on the work.
            </p>
          </div>
        ) : (
          <h2 id="apprenticeship-infra-heading" className="sr-only">
            Apprenticeship infrastructure for learners and employers
          </h2>
        )}

        <div className="grid md:grid-cols-2 gap-5 sm:gap-6 mb-8 sm:mb-10">
          <article
            id="learners"
            className={`${card.base} scroll-mt-24`}
            aria-labelledby="apprenticeship-learners-heading"
          >
            <div className={card.image16x9Desktop}>
              <Image
                src="/images/learners/coaching-session.webp"
                alt="Learner in apprenticeship training session"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
            </div>
            <div className="px-5 pt-4 pb-1 border-b border-slate-100">
              <p className={type.eyebrow}>For learners</p>
              <h3 id="apprenticeship-learners-heading" className={type.h3}>
                Earn while you learn
              </h3>
            </div>
            <div className={card.body}>
              <ul className="space-y-2" role="list">
                {LEARNER_CAPABILITIES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className={bulletDot} aria-hidden="true" />
                    <span className={type.bodySmall}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/apprenticeships#pathways"
                className="inline-flex items-center gap-1.5 mt-5 text-sm font-bold text-brand-red-600 hover:text-brand-red-700 transition-colors"
              >
                Explore apprenticeship programs <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </article>

          <article
            id="employers"
            className={`${card.base} scroll-mt-24`}
            aria-labelledby="apprenticeship-employers-heading"
          >
            <div className={card.image16x9Desktop}>
              <Image
                src="/images/pages/about-employer-partners.webp"
                alt="Employer partner working with Elevate team"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
            </div>
            <div className="px-5 pt-4 pb-1 border-b border-slate-100">
              <p className={type.eyebrow}>For employers</p>
              <h3 id="apprenticeship-employers-heading" className={type.h3}>
                Hire, train, retain
              </h3>
            </div>
            <div className={card.body}>
              <ul className="space-y-2" role="list">
                {EMPLOYER_CAPABILITIES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className={bulletDot} aria-hidden="true" />
                    <span className={type.bodySmall}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/for-employers"
                className="inline-flex items-center gap-1.5 mt-5 text-sm font-bold text-brand-red-600 hover:text-brand-red-700 transition-colors"
              >
                Employer partnership info <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>

        <div className={`${card.base} border-slate-200`}>
          <div className={hero.imageWrap}>
            <Image
              src="/images/pages/apprenticeships-page-1.webp"
              alt="Apprentice working on-site with employer supervisor"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1152px"
              loading="lazy"
            />
          </div>
          <div className="px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="max-w-lg">
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug mb-1">
                Apprenticeship isn&apos;t a program add-on. It&apos;s the pathway.
              </p>
              <p className={type.bodySmall}>
                Structured OJT, employer coordination, and RAPIDS-compatible reporting — built into every
                eligible program from day one.
              </p>
            </div>
            <Link
              href="/apprenticeship-sponsor"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shrink-0"
            >
              About our apprenticeship program <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
