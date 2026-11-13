'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
import { MapPin, Search } from 'lucide-react';
import { shopGalleryForProgram } from '@/lib/partners/curated-shop-media';
import type { HostShopNetworkEntry } from '@/lib/programs/host-shop-network-types';
import { PROGRAM_LABELS, matchesHostShopPresentationProgram } from '@/lib/programs/host-shop-programs';

type Props = { shops: HostShopNetworkEntry[]; programSlug?: string };

export default function HostShopNetworkDirectory({ shops, programSlug }: Props) {
  const [query, setQuery] = useState('');
  const [program, setProgram] = useState(programSlug ?? 'all');
  const programs = programSlug ? [programSlug] : Object.keys(PROGRAM_LABELS);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shops.filter((shop) => {
      const matchesProgram = program === 'all' || matchesHostShopPresentationProgram(shop, program);
      const haystack =
        `${shop.name} ${shop.city} ${shop.state} ${shop.address} ${shop.programs.map((slug) => PROGRAM_LABELS[slug] ?? slug).join(' ')}`.toLowerCase();
      return matchesProgram && (!needle || haystack.includes(needle));
    }).map((shop) => {
      if (program === 'all') return shop;
      const gallery = shopGalleryForProgram(shop.slug, shop.gallery ?? [], program, shop.logo);
      return { ...shop, gallery, image: gallery[0]?.url };
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
            {!programSlug ? <option value="all">All apprenticeship programs</option> : null}
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
        <div
          data-host-shop-directory
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {visible.map((shop) => (
            <article
              key={shop.id}
              className="group flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/15 bg-white text-slate-950 shadow-xl"
            >
              <HostShopMediaCarousel
                shopName={shop.name}
                videoUrl={shop.videoUrl}
                videoScript={shop.videoScript}
                compact
                items={
                  shop.gallery?.length
                    ? shop.gallery
                    : shop.image
                      ? [{ url: shop.image, alt: `${shop.name} portfolio` }]
                      : []
                }
              />
              {(shop.gallery?.length ?? 0) > 1 ? (
                <div
                  className="grid grid-cols-3 gap-1 border-t border-slate-200 bg-slate-100 p-1"
                  aria-label={`${shop.name} portfolio preview`}
                >
                  {shop.gallery?.slice(1, 4).map((photo) => (
                    <Link
                      key={photo.url}
                      href={`/host-shops/${shop.slug}`}
                      className="relative aspect-square overflow-hidden rounded-lg bg-white"
                    >
                      <Image
                        src={photo.url}
                        alt={photo.alt || `${shop.name} portfolio photograph`}
                        fill
                        sizes="(max-width: 767px) 30vw, 140px"
                        loading="lazy"
                        unoptimized={!photo.url.startsWith('/')}
                        className="object-contain"
                      />
                    </Link>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-4">
                <p className="flex items-start gap-2 text-sm font-bold text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-700" /> {shop.city},{' '}
                  {shop.state}
                </p>
                <h3 className="mt-3 text-xl font-black leading-tight sm:text-2xl text-slate-950">
                  <Link
                    href={`/host-shops/${shop.slug}`}
                    className="hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700"
                  >
                    {shop.name}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{shop.address}</p>
                {shop.phone && <p className="mt-1 text-sm text-slate-700">{shop.phone}</p>}
                {shop.approval === 'published-partner' ? (
                  <p className="mt-2 text-sm font-bold text-amber-800">
                    Apprentice placement pending
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-6 text-slate-700">{shop.description}</p>
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${shop.name} ${shop.address}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-bold"
                  >
                    Get directions
                  </a>
                  {shop.phone ? (
                    <a
                      href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-bold"
                    >
                      Call the shop
                    </a>
                  ) : null}
                  {shop.booking ? (
                    <a
                      href={shop.booking}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-lg bg-red-700 px-3 text-sm font-bold text-white"
                    >
                      Book a service ↗
                    </a>
                  ) : null}
                </div>
                {shop.website ? (
                  <a
                    href={shop.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-red-700"
                  >
                    Visit shop website ↗
                  </a>
                ) : null}
                {shop.social ? (
                  <a href={shop.social} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-red-700">
                    Photos &amp; social ↗
                  </a>
                ) : null}
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
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
            <Image
              src={getProgramHeroImage(program === 'all' ? 'cosmetology-apprenticeship' : program)}
              alt={getProgramImageAlt(program === 'all' ? 'cosmetology-apprenticeship' : program)}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              loading="lazy"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-6">
            <h3 className="text-2xl font-black">
              {query ? 'No shops match this search.' : "We're looking for new Host Shops."}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Join the network, showcase your business, and help future professionals build skills
              through supervised training.
            </p>
            <Link
              href="/partners/host-shop/apply"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-red-700 px-5 py-3 font-bold text-white"
            >
              Apply free to become a Host Shop
            </Link>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setProgram(programSlug ?? 'all');
              }}
              className="mt-3 min-h-11 font-bold text-blue-800"
            >
              Show all Host Shops
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
