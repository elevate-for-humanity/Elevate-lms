'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BadgeDollarSign, CalendarDays } from 'lucide-react';

const PROGRAMS = [
  {
    title: 'HVAC Technician',
    href: '/programs/hvac-technician',
    image: '/images/hvac-hero.webp',
    alt: 'HVAC technician working on heating and cooling equipment',
    field: 'Skilled Trades',
    summary: 'Learn safety, diagnostics, installation, maintenance, and EPA 608 preparation through online instruction and scheduled hands-on training.',
  },
  {
    title: 'CDL Training',
    href: '/programs/cdl-training',
    image: '/images/pages/cdl-loading-dock.webp',
    alt: 'Commercial truck at a loading dock for CDL training',
    field: 'Transportation',
    summary: 'Prepare for commercial driving with permit preparation, vehicle safety, inspections, and supervised road training.',
  },
  {
    title: 'Business & Entrepreneurship',
    href: '/programs/business-administration',
    image: '/images/pages/business-meeting.webp',
    alt: 'Business learners collaborating around a conference table',
    field: 'Business',
    summary: 'Build practical skills for business planning, operations, customer service, marketing, and responsible growth.',
  },
  {
    title: 'Bookkeeping',
    href: '/programs/bookkeeping',
    image: '/images/pages/bookkeeping-ledger.webp',
    alt: 'Bookkeeping learner reviewing financial records',
    field: 'Business & Finance',
    summary: 'Develop job-ready skills in bookkeeping, payroll, financial records, QuickBooks, and business reporting.',
  },
  {
    title: 'Information Technology',
    href: '/programs/it-help-desk',
    image: '/images/pages/about-career-training.webp',
    alt: 'Career-training students using computers in a modern classroom',
    field: 'Technology',
    summary: 'Build foundational support, troubleshooting, hardware, software, networking, and customer-service skills.',
  },
  {
    title: 'Certified Nursing Assistant',
    href: '/programs/cna',
    image: '/images/pages/cna-nursing-real.webp',
    alt: 'Nursing assistant providing supervised patient care',
    field: 'Healthcare',
    summary: 'Prepare for entry-level patient care through classroom learning, skills practice, and supervised clinical experience.',
  },
] as const;

export function HomeProgramShowcase({ asHero = false }: { asHero?: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % PROGRAMS.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, []);

  const program = PROGRAMS[active];
  const Heading = asHero ? 'h1' : 'h2';

  return (
    <section className="overflow-hidden bg-sky-50 px-4 py-10 sm:py-12" aria-labelledby="program-showcase-heading">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">Programs & Funding</p>
          <Heading id="program-showcase-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Train for an in-demand career. Funding may cover your cost.
          </Heading>
          <p className="mt-4 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
            Explore HVAC, CDL, business, bookkeeping, technology, healthcare, and more. Eligible participants may receive workforce funding after the responsible agency approves the participant, program, and covered costs in writing.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-200 bg-white p-4">
              <BadgeDollarSign className="h-6 w-6 text-emerald-700" />
              <p className="mt-2 font-black">Training may be no-cost if you qualify</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Apply first, complete intake, and receive written approval before funded training begins.</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-white p-4">
              <CalendarDays className="h-6 w-6 text-brand-blue-700" />
              <p className="mt-2 font-black">Enrollment is open</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Admissions confirms the program, documents, funding path, and next available start date.</p>
            </div>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href={asHero ? '/programs#program-catalog' : '/programs'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white">
              Browse training programs <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/apprenticeships" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-6 py-3 font-black text-slate-950">
              Explore apprenticeships
            </Link>
          </div>
        </div>
        <div className="relative min-w-0 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl">
          <div className="relative aspect-[4/5] w-full bg-slate-950 sm:aspect-[16/10]">
            <Image
              key={program.image}
              src={program.image}
              alt={program.alt}
              fill
              priority={active === 0}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
          </div>
          <div className="border-t border-slate-200 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-brand-red-700">{program.field}</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">{program.title}</h3>
              </div>
              <Link href={program.href} className="shrink-0 font-black text-brand-blue-800">Program details →</Link>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{program.summary}</p>
          </div>
          <div className="flex justify-center gap-2 pb-4">
            {PROGRAMS.map((item, index) => (
              <button
                key={item.href}
                type="button"
                aria-label={`Show ${item.title}`}
                aria-current={index === active ? 'true' : undefined}
                onClick={() => setActive(index)}
                className={`h-3 rounded-full transition-all ${index === active ? 'w-8 bg-brand-red-700' : 'w-3 bg-slate-300'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
