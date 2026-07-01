/**
 * HomeEmployerStrip
 *
 * Employer value proposition pulled from the for-employers page.
 * Three paths: Hire graduates, Sponsor apprentices, Co-design cohorts.
 * Bridges the gap between HomePlatformPreview and HomeSegmentedCTA.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const EMPLOYER_PATHS = [
  {
    accent: 'border-t-4 border-brand-green-500',
    img: '/images/pages/employer-page-1.webp',
    imgAlt: 'Employer reviewing pre-credentialed graduate candidates',
    title: 'Hire Pre-Credentialed Graduates',
    desc: 'Candidates complete training, earn credentials, and pass background checks before you interview them. No recruiting fees. WOTC tax credits up to $9,600 per eligible hire.',
    bullets: [
      'Healthcare — CNA, CCMA, CPT',
      'Skilled Trades — HVAC, Welding',
      'Technology — CompTIA, Certiport',
      'Business & Finance',
    ],
    cta: { label: 'Browse Talent Pipeline', href: '/employer/dashboard' },
  },
  {
    accent: 'border-t-4 border-blue-500',
    img: '/images/pages/apprenticeships-page-1.webp',
    imgAlt: 'Apprentice working on-site with employer supervisor',
    title: 'Sponsor a DOL Apprentice',
    desc: 'Earn-and-learn from day one. Apprentices work in your business while completing structured training. OJT wage reimbursement up to 50%. RAPIDS-tracked.',
    bullets: [
      'OJT wage reimbursement up to 50%',
      'RAPIDS-tracked — federal system of record',
      'DOL Certificate of Completion',
      'Barber, Cosmetology, Culinary, Trades',
    ],
    cta: { label: 'Apprenticeship Programs', href: '/programs/apprenticeships' },
  },
  {
    accent: 'border-t-4 border-purple-500',
    img: '/images/pages/training-cohort.webp',
    imgAlt: 'Custom training cohort in session',
    title: 'Co-Design a Training Cohort',
    desc: 'Work with Elevate to design a custom training cohort aligned to your job requirements. We handle curriculum, compliance, credentialing, and WIOA funding.',
    bullets: [
      'Custom curriculum to your job specs',
      'WIOA-funded — no cost to employer',
      'Cohort scheduling around your timeline',
      'Dedicated account manager',
    ],
    cta: { label: 'Talk to Our Team', href: '/contact' },
  },
];

export function HomeEmployerStrip() {
  return (
    <section
      className="bg-slate-50 py-16 px-4 border-t border-slate-100"
      aria-labelledby="employer-strip-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header with photo */}
        <div className="grid lg:grid-cols-2 gap-10 items-center mb-14">
          <div>
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">
              For Employers
            </p>
            <h2
              id="employer-strip-heading"
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4"
            >
              Hire. Sponsor. Train.
              <br />
              Three ways to work with Elevate.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-lg">
              Access a pipeline of job-ready candidates trained in healthcare, skilled trades,
              technology, and business. No recruitment fees. WIOA and WOTC eligible.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/employer/dashboard"
                className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                Employer Portal <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/for-employers"
                className="inline-flex items-center gap-2 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                Learn more
              </Link>
            </div>
          </div>

          <div className="relative h-40 sm:h-48 lg:h-52 rounded-2xl overflow-hidden">
            <Image
              src="/images/pages/for-employers-page-1.webp"
              alt={`Employer partner meeting with ${PLATFORM_DEFAULTS.orgName} team`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
              placeholder="empty"
            />
            {/* Stat overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg flex gap-6">
                <div className="text-center">
                  <p className="text-xl font-extrabold text-slate-900">50%</p>
                  <p className="text-[10px] text-slate-500 font-semibold">OJT wage reimbursement</p>
                </div>
                <div className="w-px bg-slate-200" />
                <div className="text-center">
                  <p className="text-xl font-extrabold text-slate-900">$9,600</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Max WOTC tax credit</p>
                </div>
                <div className="w-px bg-slate-200" />
                <div className="text-center">
                  <p className="text-xl font-extrabold text-slate-900">$0</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Recruitment cost</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three paths */}
        <div className="grid md:grid-cols-3 gap-6">
          {EMPLOYER_PATHS.map((path) => (
            <div
              key={path.title}
              className={`group bg-white rounded-2xl overflow-hidden shadow-sm ${path.accent} flex flex-col`}
            >
              {/* Photo */}
              <div className="relative w-full h-36 sm:h-40 overflow-hidden">
                <Image
                  src={path.img}
                  alt={path.imgAlt}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  loading="lazy"
                  placeholder="empty"
                />
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-base font-extrabold text-slate-900 mb-2">{path.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-4">{path.desc}</p>
                <ul className="space-y-1.5 mb-5">
                  {path.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={path.cta.href}
                  className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
                >
                  {path.cta.label} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
