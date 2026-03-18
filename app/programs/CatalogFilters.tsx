'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Clock } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CatalogProgram {
  slug: string;
  title: string;
  subtitle: string;
  sector: string;
  heroImage: string;
  heroImageAlt: string;
  deliveryMode: 'online' | 'hybrid' | 'in-person';
  durationWeeks: number;
  badge: string | null;
  badgeColor: string | null;
  isSelfPay: boolean;
  credentials: string[];
  entryJob: string | null;
  entrySalary: string | null;
}

interface Sector {
  key: string;
  label: string;
  description: string;
}

interface Props {
  programs: CatalogProgram[];
  sectors: Sector[];
}

// ── Filter chip config ────────────────────────────────────────────────────────

const MODE_CHIPS = [
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'In Person', value: 'in-person' },
  { label: 'Online', value: 'online' },
];

const FUNDING_CHIPS = [
  { label: 'WIOA Eligible', value: 'wioa' },
  { label: 'Grant Funded', value: 'grant' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function modeLabel(mode: string) {
  if (mode === 'in-person') return 'In Person';
  if (mode === 'hybrid') return 'Hybrid';
  return 'Online';
}

function badgeBg(color: string | null) {
  if (color === 'green') return 'bg-emerald-500/90 text-white';
  if (color === 'orange') return 'bg-brand-orange-500/90 text-white';
  if (color === 'purple') return 'bg-purple-600/90 text-white';
  return 'bg-brand-blue-600/90 text-white';
}

function modeBg(mode: string) {
  if (mode === 'hybrid') return 'bg-teal-500/90 text-white';
  if (mode === 'online') return 'bg-brand-blue-500/90 text-white';
  return 'bg-slate-700/90 text-white';
}

// ── Card ──────────────────────────────────────────────────────────────────────

function ProgramCard({ p }: { p: CatalogProgram }) {
  return (
    <Link
      href={`/programs/${p.slug}`}
      className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
    >
      {/* Cover image — no overlay, no text on image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={p.heroImage}
          alt={p.heroImageAlt}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
        {/* Top badges only — no overlay, no text */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {p.badge && (
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeBg(p.badgeColor)}`}>
              {p.badge}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${modeBg(p.deliveryMode)}`}>
            {modeLabel(p.deliveryMode)}
          </span>
        </div>
      </div>

      {/* Card body — title and meta below image */}
      <div className="px-4 py-3">
        <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-1">{p.title}</h3>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />{p.durationWeeks} weeks
          </span>
          <span className="text-xs text-slate-500">{p.isSelfPay ? 'Self-pay' : 'WIOA / Grant funded'}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CatalogFilters({ programs, sectors }: Props) {
  const [query, setQuery] = useState('');
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [activeFunding, setActiveFunding] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return programs.filter((p) => {
      if (activeSector && p.sector !== activeSector) return false;
      if (activeMode && p.deliveryMode !== activeMode) return false;
      if (activeFunding === 'wioa' && p.isSelfPay) return false;
      if (activeFunding === 'grant' && (p.isSelfPay || !p.badge?.toLowerCase().includes('grant'))) return false;
      if (q) {
        const haystack = `${p.title} ${p.subtitle} ${p.credentials.join(' ')} ${p.entryJob ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [programs, query, activeSector, activeMode, activeFunding]);

  // Group filtered results by sector for display
  const bySector = useMemo(() => {
    return sectors
      .map((s) => ({ sector: s, items: filtered.filter((p) => p.sector === s.key) }))
      .filter((g) => g.items.length > 0);
  }, [filtered, sectors]);

  const hasFilters = query || activeSector || activeMode || activeFunding;

  function toggle<T>(current: T | null, value: T, set: (v: T | null) => void) {
    set(current === value ? null : value);
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      {/* Search + filter bar */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Program Catalog</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {hasFilters ? `${filtered.length} program${filtered.length !== 1 ? 's' : ''} found` : `${programs.length} programs across ${sectors.length} sectors`}
            </h2>
          </div>
          <div className="flex w-full max-w-md gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search programs, credentials, jobs…"
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white pl-9 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            {hasFilters && (
              <button
                onClick={() => { setQuery(''); setActiveSector(null); setActiveMode(null); setActiveFunding(null); }}
                className="h-11 rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-600 hover:border-slate-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 px-6 py-4">
          {/* Sector chips */}
          {sectors.map((s) => (
            <button
              key={s.key}
              onClick={() => toggle(activeSector, s.key, setActiveSector)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeSector === s.key
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              {s.label}
            </button>
          ))}

          {/* Divider */}
          <span className="self-center text-slate-600 select-none">|</span>

          {/* Mode chips */}
          {MODE_CHIPS.map((c) => (
            <button
              key={c.value}
              onClick={() => toggle(activeMode, c.value, setActiveMode)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeMode === c.value
                  ? 'border-teal-500 bg-teal-50 text-teal-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800'
              }`}
            >
              {c.label}
            </button>
          ))}

          {/* Divider */}
          <span className="self-center text-slate-600 select-none">|</span>

          {/* Funding chips */}
          {FUNDING_CHIPS.map((c) => (
            <button
              key={c.value}
              onClick={() => toggle(activeFunding, c.value, setActiveFunding)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeFunding === c.value
                  ? 'border-brand-blue-500 bg-brand-blue-50 text-brand-blue-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-blue-300 hover:bg-brand-blue-50 hover:text-brand-blue-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500 font-medium">No programs match your filters.</p>
          <button
            onClick={() => { setQuery(''); setActiveSector(null); setActiveMode(null); setActiveFunding(null); }}
            className="mt-3 text-sm text-brand-blue-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : hasFilters ? (
        /* Flat grid when filtering */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => <ProgramCard key={p.slug} p={p} />)}
        </div>
      ) : (
        /* Sector-grouped view when no filters active */
        <div className="space-y-12">
          {bySector.map(({ sector, items }) => (
            <div key={sector.key}>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">{sector.label}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{sector.description}</p>
              </div>
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  New programs in this sector are in development.{' '}
                  <Link href="/contact" className="text-brand-blue-600 underline">Contact us</Link> to express interest.
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((p) => <ProgramCard key={p.slug} p={p} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
