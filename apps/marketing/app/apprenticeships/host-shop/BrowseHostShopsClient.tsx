'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Search,
  Users,
} from 'lucide-react';
import { siteUrls } from '@/lib/utils/site-urls';

type ProgramLabel = 'Barber' | 'Hairstylist' | 'Esthetician' | 'Manicurist';

interface HostShop {
  id: string;
  name: string;
  owner_name: string | null;
  address: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  full_address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  license_number: string | null;
  apprenticeship_plans: ProgramLabel[];
  approval_status: string;
  featured: boolean;
  google_maps_url: string | null;
  google_maps_embed_url: string | null;
}

interface HostShopResponse {
  shops: HostShop[];
  total: number;
}

const PROGRAMS: Array<'All' | ProgramLabel> = [
  'All',
  'Barber',
  'Hairstylist',
  'Esthetician',
  'Manicurist',
];

function heroImage(shop: HostShop): string {
  if (shop.apprenticeship_plans.includes('Barber')) return '/images/pages/barber-hero.webp';
  if (shop.apprenticeship_plans.includes('Esthetician')) return '/images/beauty/esthetician.webp';
  if (shop.apprenticeship_plans.includes('Manicurist')) return '/images/pages/nail-technician.webp';
  return '/images/pages/cosmetology-hero.webp';
}

function programSlug(shop: HostShop): string {
  if (shop.apprenticeship_plans.includes('Barber')) return 'barber-apprenticeship';
  if (shop.apprenticeship_plans.includes('Esthetician')) return 'esthetician-apprenticeship';
  if (shop.apprenticeship_plans.includes('Manicurist')) return 'nail-technician-apprenticeship';
  return 'cosmetology-apprenticeship';
}

function ShopCard({ shop, active, onSelect }: { shop: HostShop; active: boolean; onSelect: () => void }) {
  const slug = programSlug(shop);
  const applyHref = `/apply?program=${encodeURIComponent(slug)}&host_shop=${encodeURIComponent(shop.id)}`;

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        active ? 'border-brand-blue-500 ring-2 ring-brand-blue-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="relative h-36 overflow-hidden bg-slate-100">
          <Image
            src={heroImage(shop)}
            alt={`${shop.name} apprenticeship host shop`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 420px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-green-600 px-2.5 py-1 text-xs font-bold text-white shadow">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved Host Shop
          </div>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {shop.apprenticeship_plans.map((plan) => (
              <span key={plan} className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-900">
                {plan}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">{shop.name}</h3>
            {shop.owner_name && <p className="mt-0.5 text-sm text-slate-500">{shop.owner_name}</p>}
          </div>

          <div className="space-y-2 text-sm text-slate-700">
            {shop.full_address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue-600" />
                <span>{shop.full_address}</span>
              </div>
            )}
            {shop.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand-blue-600" />
                <span>{shop.phone}</span>
              </div>
            )}
            {shop.license_number && (
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 shrink-0 text-brand-blue-600" />
                <span>License {shop.license_number}</span>
              </div>
            )}
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4">
        {shop.google_maps_url ? (
          <a
            href={shop.google_maps_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <MapPin className="h-4 w-4" />
            Google Maps
          </a>
        ) : (
          <button disabled className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-400">
            Map unavailable
          </button>
        )}
        <Link
          href={applyHref}
          className="inline-flex items-center justify-center rounded-xl bg-brand-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-700"
        >
          Apply to Shop
        </Link>
      </div>
    </article>
  );
}

export default function BrowseHostShopsClient() {
  const [shops, setShops] = useState<HostShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [program, setProgram] = useState<'All' | ProgramLabel>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${siteUrls.app}/api/host-shops/available`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load approved host shops.');
        return (await res.json()) as HostShopResponse;
      })
      .then((payload) => {
        const next = Array.isArray(payload.shops) ? payload.shops : [];
        setShops(next);
        setSelectedId(next[0]?.id ?? null);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Unable to load approved host shops. Please try again.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shops.filter((shop) => {
      if (program !== 'All' && !shop.apprenticeship_plans.includes(program)) return false;
      if (!needle) return true;
      return `${shop.name} ${shop.owner_name ?? ''} ${shop.full_address} ${shop.apprenticeship_plans.join(' ')}`
        .toLowerCase()
        .includes(needle);
    });
  }, [shops, query, program]);

  useEffect(() => {
    if (!filtered.some((shop) => shop.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((shop) => shop.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-blue-50 px-3 py-1.5 text-sm font-semibold text-brand-blue-700">
                <Award className="h-4 w-4" />
                Registered Apprenticeship Network
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Approved Host Shops</h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Find approved salons, barbershops, spas, and beauty professionals training apprentices across Indiana. View locations, contact information, apprenticeship occupations, and directions in Google Maps.
              </p>
            </div>
            <Link
              href="/host-shop/apply"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 font-semibold text-white hover:bg-slate-800"
            >
              <Building2 className="h-5 w-5" />
              Become a Host Shop
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search shop name, city, address, or occupation..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-100"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PROGRAMS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setProgram(item)}
                className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  program === item
                    ? 'bg-brand-blue-600 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item === 'All' ? 'All Programs' : item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[560px] place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500">
            Loading approved host shops…
          </div>
        ) : error ? (
          <div className="grid min-h-[420px] place-items-center rounded-2xl border border-red-200 bg-red-50 px-6 text-center text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
            <div className="space-y-4 xl:max-h-[760px] xl:overflow-y-auto xl:pr-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <span className="font-semibold text-brand-green-700">{filtered.length} approved host shop{filtered.length === 1 ? '' : 's'}</span>
                <span className="text-slate-500">Select a shop to view its map</span>
              </div>
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <h2 className="font-bold text-slate-900">No matching host shops</h2>
                  <p className="mt-1 text-sm text-slate-500">Try another city, shop name, or apprenticeship occupation.</p>
                </div>
              ) : (
                filtered.map((shop) => (
                  <ShopCard
                    key={shop.id}
                    shop={shop}
                    active={shop.id === selected?.id}
                    onSelect={() => setSelectedId(shop.id)}
                  />
                ))
              )}
            </div>

            <div className="xl:sticky xl:top-24 xl:self-start">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {selected?.google_maps_embed_url ? (
                  <iframe
                    key={selected.id}
                    title={`Google map for ${selected.name}`}
                    src={selected.google_maps_embed_url}
                    className="h-[480px] w-full border-0 lg:h-[620px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                ) : (
                  <div className="grid h-[480px] place-items-center bg-slate-100 text-slate-500 lg:h-[620px]">
                    Map unavailable for this location
                  </div>
                )}

                {selected && (
                  <div className="border-t border-slate-200 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-950">{selected.name}</h2>
                        <p className="mt-1 text-sm text-slate-600">{selected.full_address}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selected.apprenticeship_plans.map((plan) => (
                            <span key={plan} className="rounded-full bg-brand-blue-50 px-2.5 py-1 text-xs font-semibold text-brand-blue-700">
                              {plan} Apprenticeship
                            </span>
                          ))}
                        </div>
                      </div>
                      {selected.google_maps_url && (
                        <a
                          href={selected.google_maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-700"
                        >
                          Open in Google Maps
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      {selected.phone && (
                        <a href={`tel:${selected.phone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-slate-700 hover:bg-slate-100">
                          <Phone className="h-4 w-4 text-brand-blue-600" />
                          {selected.phone}
                        </a>
                      )}
                      {selected.email && (
                        <a href={`mailto:${selected.email}`} className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-slate-700 hover:bg-slate-100">
                          <Mail className="h-4 w-4 text-brand-blue-600" />
                          {selected.email}
                        </a>
                      )}
                      {selected.website && (
                        <a href={selected.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-slate-700 hover:bg-slate-100">
                          <Globe2 className="h-4 w-4 text-brand-blue-600" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
