'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';
import { MapPin, Search, ShieldCheck } from 'lucide-react';
import type { HostShopNetworkEntry } from '@/lib/programs/host-shop-network-types';
import { PROGRAM_LABELS, matchesHostShopProgram } from '@/lib/programs/host-shop-programs';

type Props = { shops: HostShopNetworkEntry[] };

export default function HostShopNetworkDirectory({ shops }: Props) {
  const [query, setQuery] = useState('');
  const [program, setProgram] = useState('all');
  const programs = Object.keys(PROGRAM_LABELS);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shops.filter((shop) => {
      const matchesProgram = program === 'all' || matchesHostShopProgram(shop, program);
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
              className="group flex h-full min-h-0 flex-col overflow-visible rounded-2xl border border-white/15 bg-white text-slate-950 shadow-xl"
            >
              {                <div className="relative overflow-hidden rounded-t-2xl bg-slate-950">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <Image src={shop.gallery?.[0]?.url || shop.image || getProgramHeroImage(shop.primaryProgram ?? shop.programs[0] ?? 'cosmetology-apprenticeship')}
                      alt={shop.gallery?.[0]?.alt || (shop.image ? `${shop.name} portfolio` : getProgramImageAlt(shop.primaryProgram ?? shop.programs[0] ?? 'cosmetology-apprenticeship'))}
                      fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" loading="lazy" className="object-cover" />
                  </div>
                  <span
                    className={`pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black shadow ${shop.approval === 'approved' ? 'bg-emerald-100 text-emerald-950' : 'bg-blue-100 text-blue-950'}`}
                  >
                    <ShieldCheck className="h-4 w-4" />{' '}
                    {shop.approval === 'approved'
                      ? 'Approved Host Site'
                      : 'Published Network Partner'}
                  </span>
                </div>
              }
              <div className="flex flex-1 flex-col p-5">
                <p className="flex items-start gap-2 text-sm font-bold text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-700" /> {shop.city},{' '}
                  {shop.state}
                </p>
                <h3 className="mt-3 text-xl sm:text-2xl font-black leading-tight text-slate-950">
                  {shop.name}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
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
                {shop.website ? <a href={shop.website} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-red-700">Visit shop website ↗</a> : null}
                <Link
                  href={`/host-shops/${shop.slug}`}
                  className="mt-auto inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700"
                >
                  View shop profile
                </Link>
              </div>
            </article>
            ))}
        </div>
      ) : (
        <div className="mt-5 grid overflow-hidden rounded-2xl border border-white/15 bg-white text-slate-950 sm:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-100"><Image src={getProgramHeroImage(program === 'all' ? 'cosmetology-apprenticeship' : program)} alt={getProgramImageAlt(program === 'all' ? 'cosmetology-apprenticeship' : program)} fill sizes="(min-width: 640px) 50vw, 100vw" loading="lazy" className="object-cover" /></div>
          <div className="flex flex-col justify-center p-6"><h3 className="text-2xl font-black">{query ? 'No shops match this search.' : "We're looking for new Host Shops."}</h3><p className="mt-3 text-sm leading-6 text-slate-600">Join the network, showcase your business, and help future professionals build skills through supervised training.</p>
            <Link href="/host-shop/apply" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-red-700 px-5 py-3 font-bold text-white">Apply free to become a Host Shop</Link>
            <button type="button" onClick={() => { setQuery(''); setProgram('all'); }} className="mt-3 min-h-11 font-bold text-blue-800">Show all Host Shops</button>
          </div>
        </div>
      )}
    </div>
  );
}
