'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, Clock, DollarSign, Search, ShieldCheck, Star } from 'lucide-react';
import type { ProgramsPageRow } from '@/lib/programs/public-programs-page';
import PublicCatalogCard from '@/components/programs/PublicCatalogCard';

const INITIAL_VISIBLE_PROGRAMS = 12;

function durationWeeks(value: string | null | undefined): number | null {
  if (!value) return null;
  const week = value.match(/(\d+(?:\.\d+)?)\s*week/i);
  if (week) return Number(week[1]);
  const month = value.match(/(\d+(?:\.\d+)?)\s*month/i);
  if (month) return Math.round(Number(month[1]) * 4.33);
  return null;
}

export function ProgramsExplorer({
  programs,
  variant = 'training',
}: {
  programs: ProgramsPageRow[];
  variant?: 'training' | 'apprenticeship';
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [duration, setDuration] = useState('all');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PROGRAMS);
  const categories = useMemo(
    () => [...new Set(programs.map((program) => program.category))].sort(),
    [programs],
  );
  const filtered = useMemo(
    () =>
      programs.filter((program) => {
        const haystack =
          `${program.title} ${program.description || ''} ${program.category} ${program.credential || ''}`.toLowerCase();
        if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;
        if (category !== 'all' && program.category !== category) return false;
        const weeks = durationWeeks(program.duration);
        if (duration === 'short' && (weeks == null || weeks > 8)) return false;
        if (duration === 'medium' && (weeks == null || weeks <= 8 || weeks > 24)) return false;
        if (duration === 'long' && (weeks == null || weeks <= 24)) return false;
        return true;
      }),
    [programs, query, category, duration],
  );

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_PROGRAMS);
  }, [query, category, duration]);

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <label className="relative block">
            <span className="sr-only">Search programs</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search career, credential, or program"
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm"
            />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"
            >
              <option value="all">All career categories</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by duration</span>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"
            >
              <option value="all">Any duration</option>
              <option value="short">8 weeks or less</option>
              <option value="medium">9–24 weeks</option>
              <option value="long">25+ weeks</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600" aria-live="polite">
          Showing {Math.min(filtered.length, visibleCount)} of {filtered.length} matching programs
        </p>
      </div>
      {filtered.length ? (
        <div className="mt-6 grid auto-rows-fr items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, visibleCount).map((program) => (
            <PublicCatalogCard key={program.slug} program={program} variant={variant} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-700">
          No programs match these filters. Clear a filter or search another career or credential.
        </div>
      )}
      {filtered.length > visibleCount ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_PROGRAMS)}
            className="min-h-12 rounded-xl border-2 border-slate-900 bg-white px-7 py-3 font-black text-slate-950 hover:bg-slate-50"
          >
            Show 12 more programs
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ProgramsExplorer;
