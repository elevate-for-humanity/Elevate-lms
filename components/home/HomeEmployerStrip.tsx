/**
 * HomeEmployerStrip
 *
 * Three canonical employer paths: hire graduates, become an apprenticeship
 * Host Site, or co-design a training cohort.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ROUTES } from '@/lib/navigation/routes';

const EMPLOYER_PATHS = [
  {
    accent: 'border-t-4 border-brand-green-500',
    img: '/images/pages/employer-page-1.webp',
    imgAlt: 'Employer reviewing credentialed graduate candidates',
    title: 'Hire Credentialed Graduates',
    desc: 'Connect with trained candidates across healthcare, skilled trades, technology, and business pathways.',
    bullets: [
      'Healthcare — CNA, CCMA, CPT',
      'Skilled Trades — HVAC and related pathways',
      'Technology — CompTIA and Certiport-aligned skills',
      'Business and administrative pathways',
    ],
    cta: { label: 'Hiring & Employer Services', href: ROUTES.employersHireGraduates },
  },
  {
    accent: 'border-t-4 border-blue-500',
    img: '/images/pages/apprenticeship-sponsor-page-1.webp',
    imgAlt: 'Apprentice working on-site with an employer supervisor',
    title: 'Become an Apprenticeship Host Site',
    desc: 'Approved businesses provide supervised on-the-job learning while Elevate manages Registered Apprenticeship sponsor governance, RTI, tracking, and compliance workflows.',
    bullets: [
      'Barber, Cosmetology, Esthetics, and Nail Technician pathways',
      'Digital hour and competency verification',
      'One universal Host Site application',
      'Dedicated Host Site portal after approval',
    ],
    cta: { label: 'Host Site Program', href: ROUTES.apprenticeshipsHostShop },
  },
  {
    accent: 'border-t-4 border-purple-500',
    img: '/images/pages/training-cohort.webp',
    imgAlt: 'Custom employer training cohort in session',
    title: 'Co-Design a Training Cohort',
    desc: 'Work with Elevate to structure a training cohort around job requirements, scheduling, credentials, and available workforce funding.',
    bullets: [
      'Training aligned to employer requirements',
      'Funding eligibility reviewed by program and participant',
      'Cohort scheduling around operational needs',
      'Centralized training and compliance coordination',
    ],
    cta: { label: 'Talk to Our Team', href: ROUTES.contact },
  },
];

export function HomeEmployerStrip() {
  return (
    <section
      className="border-t border-slate-200 bg-slate-50 px-4 py-16"
      aria-labelledby="employer-strip-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-brand-red-700">
              For Employers
            </p>
            <h2
              id="employer-strip-heading"
              className="mb-4 text-2xl font-black text-slate-950 sm:text-3xl"
            >
              Hire. Host. Train.
              <br />
              Three clear ways to work with Elevate.
            </h2>
            <p className="mb-6 max-w-lg text-base font-medium leading-7 text-slate-700">
              Use the employer pathway that matches your goal. Public information stays on the main website; authenticated employer and Host Site work stays in the LMS portal.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={ROUTES.employerPortal}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-red-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-800"
              >
                Employer Portal <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href={ROUTES.employers}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-900 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-white"
              >
                Employer Overview
              </Link>
            </div>
          </div>

          <div className="relative h-40 overflow-hidden rounded-2xl sm:h-48 lg:h-52">
            <Image
              src="/images/pages/for-employers-page-1.webp"
              alt={`Employer partner meeting with ${PLATFORM_DEFAULTS.orgName} team`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
              placeholder="empty"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {EMPLOYER_PATHS.map((path) => (
            <article
              key={path.title}
              className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${path.accent}`}
            >
              <div className="relative h-36 w-full overflow-hidden sm:h-40">
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

              <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-2 text-lg font-black text-slate-950">{path.title}</h3>
                <p className="mb-4 flex-1 text-sm font-medium leading-6 text-slate-700">{path.desc}</p>
                <ul className="mb-5 space-y-2">
                  {path.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm font-medium leading-5 text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" aria-hidden="true" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Link
                  href={path.cta.href}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                >
                  {path.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
