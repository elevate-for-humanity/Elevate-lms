'use client';
import Link from 'next/link';
import { ArrowRight, Award, Clock, DollarSign, ShieldCheck, Star } from 'lucide-react';
import type { ProgramsPageRow } from '@/lib/programs/public-programs-page';
import { getProgramCardImage } from '@/lib/images/programImages';
import ProgramCardImage from './ProgramCardImage';
export default function PublicCatalogCard({
  program,
  variant = 'training',
}: {
  program: ProgramsPageRow;
  variant?: 'training' | 'apprenticeship';
}) {
  const apprenticeship = variant === 'apprenticeship';
  const funded = program.funding_tier === 'workforce-funded';
  const image = getProgramCardImage(program.slug);
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
        <ProgramCardImage
          src={image}
          alt={`${program.title} training program`}
          category={program.category}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {apprenticeship ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue-800 px-3 py-1.5 text-sm font-extrabold text-white shadow">
              <ShieldCheck className="h-4 w-4" /> Earn while you learn
            </span>
          ) : funded ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-sm font-extrabold text-white shadow">
              <ShieldCheck className="h-4 w-4" /> Funding pathway
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-extrabold text-white shadow">
              <DollarSign className="h-4 w-4" /> Payment options
            </span>
          )}
          {!apprenticeship && funded && program.top_jobs_stars ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" /> {program.top_jobs_stars}★
              Top Jobs
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
          {program.category}
        </p>
        <h3 className="line-clamp-2 min-h-[3.5rem] break-words text-xl font-extrabold leading-tight text-slate-950">
          {program.title}
        </h3>
        {program.description ? (
          <p className="mt-3 line-clamp-3 text-base leading-relaxed text-slate-600">
            {program.description}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-600">
          {program.duration ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {program.duration}
            </span>
          ) : null}
          {program.credential ? (
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-4 w-4" />
              {program.credential}
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
          <Link
            href={program.detailHref ?? `/programs/${program.slug}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-base font-bold text-white hover:bg-slate-800"
          >
            View Program <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={program.applicationHref ?? `/apply?program=${program.slug}`}
            className={`inline-flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-base font-bold ${funded ? 'bg-brand-red-600 text-white hover:bg-brand-red-700' : 'border border-slate-300 text-slate-900 hover:bg-slate-50'}`}
          >
            {apprenticeship
              ? 'Apply for Apprenticeship'
              : funded
                ? 'Start Application'
                : 'See Payment Options'}
          </Link>
        </div>
      </div>
    </article>
  );
}
