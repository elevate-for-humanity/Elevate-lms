/**
 * HomeApprenticeshipInfra
 *
 * Communicates the apprenticeship + employer infrastructure in human language.
 * Shows RAPIDS tracking, OJT oversight, employer dashboards - framed as
 * "what this means for you" not "look at our tech stack."
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

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
  'Hours tracked automatically - no paperwork',
  'Geofenced check-in at employer sites',
  'Apprenticeship progress visible in your portal',
  'Credential issued on completion, publicly verifiable',
  'Pathway to journeyman status and wage increases',
];

export function HomeApprenticeshipInfra() {
  return (
    <section
      className="bg-slate-50 py-12 sm:py-14 lg:py-12 px-4 border-t border-slate-100"
      aria-labelledby="apprenticeship-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">
            Apprenticeship Infrastructure
          </p>
          <h2
            id="apprenticeship-heading"
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3"
          >
            Real apprenticeships. Real oversight.
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed">
            Elevate is a DOL-registered apprenticeship sponsor. That means structured OJT,
            employer coordination, RAPIDS-compatible tracking, and compliance documentation -
            all managed so employers and learners can focus on the work.
          </p>
        </div>

        {/* Two-column: learner + employer */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Learner side */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="relative h-40 lg:h-44 w-full">
              <Image
                src="/images/learners/coaching-session.webp"
                alt="Learner in apprenticeship training session"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
                placeholder="empty"
              />
            </div>
            <div className="px-6 pt-4 pb-1 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">For Learners</p>
              <h3 className="text-base font-extrabold text-slate-900">Earn while you learn</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-2" role="list">
                {LEARNER_CAPABILITIES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" aria-hidden="true" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/apprenticeships"
                className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold text-brand-red-600 hover:text-brand-red-700 transition-colors"
              >
                Explore apprenticeship programs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Employer side */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="relative h-40 lg:h-44 w-full">
              <Image
                src="/images/pages/about-employer-partners.webp"
                alt="Employer partner working with Elevate team"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
                placeholder="empty"
              />
            </div>
            <div className="px-6 pt-4 pb-1 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">For Employers</p>
              <h3 className="text-base font-extrabold text-slate-900">Hire, train, retain</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-2" role="list">
                {EMPLOYER_CAPABILITIES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" aria-hidden="true" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/for-employers"
                className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold text-brand-red-600 hover:text-brand-red-700 transition-colors"
              >
                Employer partnership info <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Photo + copy strip */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
          <div className="relative h-48 sm:h-56 w-full">
            <Image
              src="/images/pages/apprenticeships-page-1.webp"
              alt="Apprentice working on-site with employer supervisor"
              fill
              className="object-cover object-top"
              sizes="(max-width: 1280px) 100vw, 1152px"
              loading="lazy"
              placeholder="empty"
            />
          </div>
          <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="max-w-lg">
              <p className="text-slate-900 text-lg sm:text-xl font-extrabold leading-snug mb-1">
                Apprenticeship isn&apos;t a program add-on. It&apos;s the pathway.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Structured OJT, employer coordination, and RAPIDS-compatible reporting - built
                into every eligible program from day one.
              </p>
            </div>
            <Link
              href="/apprenticeship-sponsor"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shrink-0"
            >
              About our apprenticeship program <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
