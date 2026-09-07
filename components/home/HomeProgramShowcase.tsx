'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BadgeDollarSign, CalendarDays } from 'lucide-react';

const PROGRAMS = [
  { title: 'HVAC Technician', href: '/programs/hvac-technician', image: '/images/cohorts/hvac-october-15-cohort-flyer.jpg', alt: 'HVAC Technician career-training enrollment flyer', field: 'Skilled Trades' },
  { title: 'CDL Training', href: '/programs/cdl-training', image: '/images/cohorts/cdl-october-15-cohort-flyer.jpg', alt: 'CDL commercial driver career-training enrollment flyer', field: 'Transportation' },
  { title: 'Business & Entrepreneurship', href: '/programs/business-administration', image: '/images/cohorts/business-october-15-cohort-flyer.jpg', alt: 'Business and entrepreneurship career-training enrollment flyer', field: 'Business' },
  { title: 'Bookkeeping', href: '/programs/bookkeeping', image: '/images/cohorts/bookkeeping-october-15-cohort-flyer.jpg', alt: 'Bookkeeping career-training enrollment flyer', field: 'Business & Finance' },
  { title: 'Information Technology', href: '/programs/it-help-desk', image: '/images/cohorts/it-october-15-cohort-flyer.jpg', alt: 'Information technology career-training enrollment flyer', field: 'Technology' },
] as const;

export function HomeProgramShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((index) => (index + 1) % PROGRAMS.length), 5500);
    return () => window.clearInterval(timer);
  }, []);

  const program = PROGRAMS[active];
  return <section className="overflow-hidden bg-sky-50 px-4 py-12 sm:py-20" aria-labelledby="program-showcase-heading">
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">Programs & Funding</p>
        <h2 id="program-showcase-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Train for an in-demand career. Funding may cover your cost.</h2>
        <p className="mt-4 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">Explore HVAC, CDL, business, bookkeeping, technology, healthcare, and more. Eligible participants may receive workforce funding after the responsible agency approves the program, participant, and covered costs in writing.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-blue-200 bg-white p-4"><BadgeDollarSign className="h-6 w-6 text-emerald-700" /><p className="mt-2 font-black">Training may be no-cost if you qualify</p><p className="mt-1 text-sm leading-6 text-slate-600">Funding is limited and is never guaranteed before written authorization.</p></div>
          <div className="rounded-2xl border border-blue-200 bg-white p-4"><CalendarDays className="h-6 w-6 text-brand-blue-700" /><p className="mt-2 font-black">Enrollment is open</p><p className="mt-1 text-sm leading-6 text-slate-600">Upcoming cohorts are forming now. Admissions confirms the next available start date.</p></div>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/programs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white">View all programs <ArrowRight className="h-4 w-4" /></Link><Link href="/funding" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-6 py-3 font-black text-slate-950">Check funding steps</Link></div>
      </div>
      <div className="relative overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl">
        <div className="relative aspect-[16/10]"><Image key={program.image} src={program.image} alt={program.alt} fill priority={active === 0} className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" /></div>
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 p-4 sm:p-5"><div><p className="text-xs font-black uppercase tracking-wider text-brand-red-700">{program.field}</p><h3 className="mt-1 text-xl font-black text-slate-950">{program.title}</h3></div><Link href={program.href} className="shrink-0 font-black text-brand-blue-800">Program details →</Link></div>
        <div className="flex justify-center gap-2 pb-4">{PROGRAMS.map((item, index) => <button key={item.href} type="button" aria-label={`Show ${item.title}`} aria-current={index === active ? 'true' : undefined} onClick={() => setActive(index)} className={`h-3 rounded-full transition-all ${index === active ? 'w-8 bg-brand-red-700' : 'w-3 bg-slate-300'}`} />)}</div>
      </div>
    </div>
  </section>;
}
