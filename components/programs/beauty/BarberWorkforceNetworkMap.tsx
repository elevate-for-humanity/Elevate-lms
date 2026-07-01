'use client';

import { useMemo, useState } from 'react';
import { MapPin, Navigation, Phone } from 'lucide-react';
import {
  BARBER_WORKFORCE_NETWORK_PINS,
  type NetworkMapPin,
} from '@/lib/beauty-apprenticeship/workforce-network-locations';

const KIND_LABEL: Record<NetworkMapPin['kind'], string> = {
  workone: 'WorkOne',
  elevate: 'Elevate',
  host_shop: 'Host shop',
  satellite: 'Satellite / partner site',
};

function directionsUrl(pin: NetworkMapPin) {
  const q = encodeURIComponent(`${pin.address}, ${pin.city}, ${pin.state} ${pin.zip}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

function embedUrl(pin: NetworkMapPin) {
  const q = encodeURIComponent(`${pin.lat},${pin.lng}`);
  return `https://www.google.com/maps?q=${q}&z=14&output=embed`;
}

export default function BarberWorkforceNetworkMap() {
  const [selectedId, setSelectedId] = useState(BARBER_WORKFORCE_NETWORK_PINS[0]?.id ?? '');
  const selected = useMemo(
    () => BARBER_WORKFORCE_NETWORK_PINS.find((p) => p.id === selectedId) ?? BARBER_WORKFORCE_NETWORK_PINS[0],
    [selectedId],
  );

  return (
    <section className="py-12 bg-white border-y border-slate-200" id="network-map">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-2">
          Find support near you
        </p>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Barber program map — host shops, WorkOne &amp; satellites
        </h2>
        <p className="text-slate-600 mb-8 max-w-3xl leading-relaxed">
          Use this map to find the nearest WorkOne center for WIOA funding, Elevate enrollment
          support, and approved host barbershops — including Elevate Prestige Barber and Beauty
          Institute and Kountry Kutz Barbershop.
        </p>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {BARBER_WORKFORCE_NETWORK_PINS.map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => setSelectedId(pin.id)}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${
                  pin.id === selected?.id
                    ? 'border-brand-red-500 bg-brand-red-50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-blue-700">
                  {KIND_LABEL[pin.kind]}
                </span>
                <p className="font-semibold text-slate-900 mt-1">{pin.name}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {pin.address}, {pin.city}, {pin.state}
                </p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {selected && (
              <>
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-md h-[280px] sm:h-[360px] mb-4">
                  <iframe
                    title={`Map — ${selected.name}`}
                    src={embedUrl(selected)}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={directionsUrl(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-700"
                  >
                    <Navigation className="w-4 h-4" />
                    Directions
                  </a>
                  {selected.phone && (
                    <a
                      href={`tel:${selected.phone.replace(/[^0-9]/g, '')}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      <Phone className="w-4 h-4" />
                      {selected.phone}
                    </a>
                  )}
                  {selected.href && (
                    <a
                      href={selected.href}
                      target={selected.href.startsWith('http') ? '_blank' : undefined}
                      rel={selected.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      <MapPin className="w-4 h-4" />
                      More info
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          All Indiana WorkOne centers:{' '}
          <a
            href="https://www.in.gov/dwd/workone/workone-locations/"
            className="text-brand-blue-600 hover:underline"
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
