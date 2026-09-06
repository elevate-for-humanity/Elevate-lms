'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Search, ShieldCheck } from 'lucide-react';
import type { HostShopNetworkEntry } from '@/lib/programs/host-shop-network-types';
import { PROGRAM_LABELS } from '@/lib/programs/host-shops';

type Props = { shops: HostShopNetworkEntry[] };

export default function HostShopNetworkDirectory({ shops }: Props) {
  const [query, setQuery] = useState('');
  const [program, setProgram] = useState('all');
  const programs = useMemo(
    () => [...new Set(shops.flatMap((shop) => shop.programs))].sort(),
    [shops],
  );
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shops.filter((shop) => {
      const matchesProgram = program === 'all' || shop.programs.includes(program);
      const haystack =
        `${shop.name} ${shop.city} ${shop.state} ${shop.address} ${shop.programs.map((slug) => PROGRAM_LABELS[slug] ?? slug).join(' ')}`.toLowerCase();
      return matchesProgram && (!needle || haystack.includes(needle));
    });
  }, [program, query, shops]);

  return (
    <div className="mt-8">
      <div className="grid gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 sm:grid-cols-[1fr_280px]">
        <label className="relative block">
          <span className="sr-only">Search Host Shops</span>
          <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by shop, city, or program"
            className="min-h-12 w-full rounded-xl border border-white/15 bg-white py-3 pl-12 pr-4 text-base text-slate-950 outline-none ring-red-400 placeholder:text-slate-500 focus:ring-2"
          />
        </label>
        <label>
          <span className="sr-only">Filter by apprenticeship program</span>
          <select
            value={program}
            onChange={(event) => setProgram(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-base font-bold text-slate-950 outline-none ring-red-400 focus:ring-2"
          >
            <option value="all">All apprenticeship programs</option>
            {programs.map((slug) => (
              <option key={slug} value={slug}>
                {PROGRAM_LABELS[slug] ?? slug}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-4 text-sm font-bold text-slate-300" aria-live="polite">
        {visible.length} network {visible.length === 1 ? 'location' : 'locations'}
      </p>

      {visible.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((shop) => (
            <article
              key={shop.id}
              className="group overflow-hidden rounded-2xl border border-white/15 bg-white text-slate-950 shadow-xl"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                {shop.image ? (
                  <img
                    src={shop.image}
                    alt={`${shop.name} Host Shop`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300">
                    <Building2 className="h-16 w-16 text-slate-500" aria-hidden="true" />
                  </div>
                )}
                <span
                  className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black shadow ${shop.approval === 'approved' ? 'bg-emerald-100 text-emerald-950' : 'bg-blue-100 text-blue-950'}`}
                >
                  <ShieldCheck className="h-4 w-4" />{' '}
                  {shop.approval === 'approved'
                    ? 'Approved Host Site'
                    : 'Published Network Partner'}
                </span>
              </div>
              <div className="p-5">
                <p className="flex items-start gap-2 text-sm font-bold text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-700" /> {shop.city},{' '}
                  {shop.state}
                </p>
                <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950">
                  {shop.name}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">
                  {shop.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {shop.programs.map((slug) => (
                    <span
                      key={slug}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                    >
                      {PROGRAM_LABELS[slug] ?? slug}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/host-shops/${shop.slug}`}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700"
                >
                  View shop profile
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-slate-200">
          No network shops match this search. Clear the filters or apply to add a new location.
        </div>
      )}
    </div>
  );
}
