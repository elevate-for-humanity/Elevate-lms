'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Search, UserPlus, Users } from 'lucide-react';
import type { HostShopNetworkEntry } from '@/lib/programs/host-shop-network-types';

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export default function HostShopPlacementGuideClient({
  programSlug,
  shops,
}: {
  programSlug: string;
  shops: HostShopNetworkEntry[];
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = normalized(query);
    if (!q) return shops;
    return shops.filter((shop) =>
      normalized([shop.name, shop.city, shop.state, shop.address].filter(Boolean).join(' ')).includes(q),
    );
  }, [query, shops]);

  const suggestionHref = `/contact?topic=host-shop-suggestion&program=${encodeURIComponent(programSlug)}`;
  const waitlistHref = `/apply/student?program=${encodeURIComponent(programSlug)}&placement=waitlist`;

  return (
    <section className="border-y border-slate-200 bg-white px-4 py-14 sm:py-18" aria-labelledby="host-shop-placement-heading">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700 sm:text-sm">Find your training location</p>
          <h2 id="host-shop-placement-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Find an approved Host Shop near you.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-700 sm:text-lg">
            Search the current Host Shop network by city, ZIP code, or shop name. A public listing confirms participation in the network, not a guaranteed opening. Placement is confirmed during enrollment.
          </p>
        </div>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <label htmlFor="host-shop-search" className="text-sm font-black text-slate-950">City, ZIP code, or shop name</label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3">
            <Search className="h-5 w-5 text-slate-500" aria-hidden="true" />
            <input
              id="host-shop-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Example: Indianapolis, 46205, or Cal's Kutz"
              className="min-h-12 w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {filtered.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((shop) => {
              const address = shop.address || [shop.city, shop.state].filter(Boolean).join(', ');
              const directions = address
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
                : undefined;
              return (
                <article key={shop.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="aspect-[16/10] bg-slate-100">
                    {shop.image ? (
                      <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Building2 className="h-12 w-12 text-slate-300" /></div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black text-slate-950">{shop.name}</h3>
                        <p className="mt-1 flex items-start gap-2 text-sm text-slate-600">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{address || 'Location available during placement review'}</span>
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-800">
                        Approved network
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-700">{shop.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link href={`/host-shops/${shop.slug}`} className="inline-flex min-h-10 items-center rounded-lg bg-brand-blue-800 px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-900">
                        View Host Shop
                      </Link>
                      {directions ? (
                        <a href={directions} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-900 hover:bg-slate-50">
                          Directions
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-7 text-center">
            <MapPin className="mx-auto h-9 w-9 text-slate-400" />
            <h3 className="mt-3 text-xl font-black text-slate-950">No matching Host Shop is listed in that area yet.</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              That does not end your apprenticeship path. You can suggest a licensed shop in your area for Elevate to review, or join the Host Shop placement waitlist.
            </p>
          </div>
        )}

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-sky-50 p-6">
            <Building2 className="h-6 w-6 text-brand-blue-800" />
            <h3 className="mt-3 text-lg font-black text-slate-950">I already know a shop</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">Submit the business for Host Shop review. The shop must meet program, licensing, supervision, employment, and documentation requirements before apprenticeship training is approved there.</p>
            <Link href={suggestionHref} className="mt-4 inline-flex font-black text-brand-blue-900 underline underline-offset-4">Suggest this shop</Link>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-amber-50 p-6">
            <UserPlus className="h-6 w-6 text-amber-800" />
            <h3 className="mt-3 text-lg font-black text-slate-950">No approved shop near me</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">Tell Elevate about a licensed business near you. Suggesting a shop does not automatically approve it; Elevate must complete the Host Shop review first.</p>
            <Link href={suggestionHref} className="mt-4 inline-flex font-black text-amber-900 underline underline-offset-4">Suggest a local shop</Link>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-emerald-50 p-6">
            <Users className="h-6 w-6 text-emerald-800" />
            <h3 className="mt-3 text-lg font-black text-slate-950">Join the placement waitlist</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">If there is no confirmed opening, join the geographic placement waitlist so your preferred area can be considered as Host Shop capacity becomes available.</p>
            <Link href={waitlistHref} className="mt-4 inline-flex font-black text-emerald-900 underline underline-offset-4">Join Host Shop waitlist</Link>
          </article>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-sky-300">Important placement rule</p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-200">
            You do not have to solve Host Shop placement by yourself. Elevate can review a shop you suggest or place you on the waitlist. Apprenticeship hours only count after the Host Shop, employment arrangement, supervision, and program requirements are formally approved.
          </p>
        </div>
      </div>
    </section>
  );
}
