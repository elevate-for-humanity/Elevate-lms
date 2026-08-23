'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, Clock, DollarSign, Search, ShieldCheck, Star } from 'lucide-react';
import type { ProgramsPageRow } from '@/lib/programs/public-programs-page';
import { getProgramCardImage } from '@/lib/images/programImages';
import ProgramCardImage from './ProgramCardImage';

function durationWeeks(value: string | null | undefined): number | null {
  if (!value) return null;
  const week = value.match(/(\d+(?:\.\d+)?)\s*week/i);
  if (week) return Number(week[1]);
  const month = value.match(/(\d+(?:\.\d+)?)\s*month/i);
  if (month) return Math.round(Number(month[1]) * 4.33);
  return null;
}

function ProgramCard({ program }: { program: ProgramsPageRow }) {
  const funded = program.funding_tier === 'workforce-funded';
  const image = getProgramCardImage(program.slug);
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/programs/${program.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <ProgramCardImage src={image} alt={`${program.title} training program`} category={program.category} />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {funded ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-sm font-extrabold text-white shadow"><ShieldCheck className="h-4 w-4" /> Funding pathway</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-extrabold text-white shadow"><DollarSign className="h-4 w-4" /> Self-Pay</span>
            )}
            {funded && program.top_jobs_stars ? <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow"><Star className="h-4 w-4 fill-amber-400 text-amber-500" /> {program.top_jobs_stars}★ Top Jobs</span> : null}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">{program.category}</p>
        <h3 className="line-clamp-2 min-h-[3.5rem] text-xl font-extrabold leading-tight text-slate-950"><Link href={`/programs/${program.slug}`} className="break-words hover:text-brand-red-700">{program.title}</Link></h3>
        {program.description ? <p className="mt-3 line-clamp-3 text-base leading-relaxed text-slate-600">{program.description}</p> : null}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-600">
          {program.duration ? <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{program.duration}</span> : null}
          {program.credential ? <span className="inline-flex items-center gap-1.5"><Award className="h-4 w-4" />{program.credential}</span> : null}
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
          <Link href={`/programs/${program.slug}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-base font-bold text-white hover:bg-slate-800">View Program <ArrowRight className="h-4 w-4" /></Link>
          <Link href={`/apply?program=${program.slug}`} className={`inline-flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-base font-bold ${funded ? 'bg-brand-red-600 text-white hover:bg-brand-red-700' : 'border border-slate-300 text-slate-900 hover:bg-slate-50'}`}>{funded ? 'Start Application' : 'Self-Pay Enrollment'}</Link>
        </div>
      </div>
    </article>
  );
}

export function ProgramsExplorer({ programs }: { programs: ProgramsPageRow[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [duration, setDuration] = useState('all');
  const categories = useMemo(() => [...new Set(programs.map((program) => program.category))].sort(), [programs]);
  const filtered = useMemo(() => programs.filter((program) => {
    const haystack = `${program.title} ${program.description || ''} ${program.category} ${program.credential || ''}`.toLowerCase();
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;
    if (category !== 'all' && program.category !== category) return false;
    const weeks = durationWeeks(program.duration);
    if (duration === 'short' && (weeks == null || weeks > 8)) return false;
    if (duration === 'medium' && (weeks == null || weeks <= 8 || weeks > 24)) return false;
    if (duration === 'long' && (weeks == null || weeks <= 24)) return false;
    return true;
  }), [programs, query, category, duration]);

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <label className="relative block"><span className="sr-only">Search programs</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search career, credential, or program" className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm" /></label>
          <label><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"><option value="all">All career categories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span className="sr-only">Filter by duration</span><select value={duration} onChange={(event) => setDuration(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"><option value="all">Any duration</option><option value="short">8 weeks or less</option><option value="medium">9–24 weeks</option><option value="long">25+ weeks</option></select></label>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600">Showing {filtered.length} of {programs.length} programs</p>
      </div>
      {filtered.length ? <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{filtered.map((program) => <ProgramCard key={program.slug} program={program} />)}</div> : <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-700">No programs match these filters. Clear a filter or search another career or credential.</div>}
    </div>
  );
}

export default ProgramsExplorer;
