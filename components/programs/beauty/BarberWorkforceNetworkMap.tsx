'use client';

import { useMemo, useState } from 'react';
import { MapPin, Navigation, Phone } from 'lucide-react';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';
import {
  BARBER_WORKFORCE_NETWORK_PINS,
  type NetworkMapPin,
} from '@/lib/apprenticeship-programs/workforce-network-locations';

type DisplayPin = {
  id: string;
  kind: NetworkMapPin['kind'];
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  lat?: number;
  lng?: number;
  href?: string;
};

const KIND_LABEL: Record<DisplayPin['kind'], string> = {
  workone: 'WorkOne',
  elevate: 'Elevate',
  host_shop: 'Host shop',
  satellite: 'Satellite / partner site',
};

const HOST_SHOP_PINS: DisplayPin[] = FEATURED_BEAUTY_HOST_PARTNERS.map((shop) => ({
  id: `host-${shop.slug}`,
  kind: 'host_shop',
  name: shop.dba ?? shop.name,
  address: shop.address,
  city: shop.city,
  state: shop.state,
  zip: shop.zip,
  phone: shop.phone,
  href: `/host-shops/${shop.slug}`,
}));

const SUPPORT_PINS: DisplayPin[] = BARBER_WORKFORCE_NETWORK_PINS
  .filter((pin) => pin.kind !== 'host_shop')
  .map((pin) => ({ ...pin }));

const MAP_PINS: DisplayPin[] = [...HOST_SHOP_PINS, ...SUPPORT_PINS];

function fullAddress(pin: DisplayPin) {
  return `${pin.address}, ${pin.city}, ${pin.state} ${pin.zip}`;
}

function directionsUrl(pin: DisplayPin) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(pin))}`;
}

function embedUrl(pin: DisplayPin) {
  const q = pin.lat != null && pin.lng != null ? `${pin.lat},${pin.lng}` : fullAddress(pin);
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=14&output=embed`;
}

export default function BarberWorkforceNetworkMap() {
  const [selectedId, setSelectedId] = useState(MAP_PINS[0]?.id ?? '');
  const selected = useMemo(
    () => MAP_PINS.find((pin) => pin.id === selectedId) ?? MAP_PINS[0],
    [selectedId],
  );

  return (
    <section className="border-y border-slate-200 bg-white py-12" id="network-map">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-red-700">
          Find support near you
        </p>
        <h2 className="mb-3 text-2xl font-bold text-slate-950">
          Barber program map — every host shop plus workforce support
        </h2>
        <p className="mb-8 max-w-3xl font-medium leading-relaxed text-slate-800">
          Select any approved host shop to see its exact public address, phone number when verified,
          map, and directions. WorkOne and Elevate support locations remain available in the same map.
        </p>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1 lg:col-span-2">
            {MAP_PINS.map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => setSelectedId(pin.id)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  pin.id === selected?.id
                    ? 'border-brand-red-500 bg-brand-red-50'
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wide text-brand-blue-800">
                  {KIND_LABEL[pin.kind]}
                </span>
                <p className="mt-1 font-bold text-slate-950">{pin.name}</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{fullAddress(pin)}</p>
                {pin.phone ? <p className="mt-1 text-sm font-semibold text-slate-700">{pin.phone}</p> : null}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {selected ? (
              <>
                <div className="mb-4 h-[280px] overflow-hidden rounded-xl border border-slate-300 shadow-md sm:h-[390px]">
                  <iframe
                    title={`Map — ${selected.name}`}
                    src={embedUrl(selected)}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="mb-4">
                  <p className="text-lg font-black text-slate-950">{selected.name}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{fullAddress(selected)}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={directionsUrl(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-red-700"
                  >
                    <Navigation className="h-4 w-4" /> Directions
                  </a>
                  {selected.phone ? (
                    <a
                      href={`tel:${selected.phone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50"
                    >
                      <Phone className="h-4 w-4" /> {selected.phone}
                    </a>
                  ) : null}
                  {selected.href ? (
                    <a
                      href={selected.href}
                      target={selected.href.startsWith('http') ? '_blank' : undefined}
                      rel={selected.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50"
                    >
                      <MapPin className="h-4 w-4" /> More info
                    </a>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <p className="mt-6 text-xs font-medium text-slate-700">
          All Indiana WorkOne centers:{' '}
          <a
            href="https://www.in.gov/dwd/workone/workone-locations/"
            className="font-bold text-brand-blue-700 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            in.gov WorkOne locator
          </a>
        </p>
      </div>
    </section>
  );
}
