'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Monitor, Smartphone, Tablet } from 'lucide-react';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

type Device = 'desktop' | 'tablet' | 'mobile';

const widths: Record<Device, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

export function ResponsivePreviewClient({
  websiteId,
  siteName,
  config,
}: {
  websiteId: string;
  siteName: string;
  config: TenantSiteConfig;
}) {
  const [device, setDevice] = useState<Device>('desktop');

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link href={`/apps/website-builder/edit/${websiteId}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" /> Back to editor
            </Link>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Responsive preview · {siteName}</h1>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {([
              ['desktop', Monitor, 'Desktop'],
              ['tablet', Tablet, 'Tablet'],
              ['mobile', Smartphone, 'Mobile'],
            ] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setDevice(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${device === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white'}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="overflow-auto px-4 py-8">
        <div className="mx-auto transition-[width] duration-200" style={{ width: `min(100%, ${widths[device]}px)` }}>
          <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs font-bold text-slate-500">
              {device.toUpperCase()} · {widths[device]}px
            </div>
            <div style={{ backgroundColor: config.branding.backgroundColor || '#ffffff', color: config.branding.textColor || '#0f172a' }}>
              <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <strong style={{ color: config.branding.primaryColor }}>{config.branding.logoText || siteName}</strong>
                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                  {config.navigation.slice(0, device === 'mobile' ? 2 : 6).map((item) => <span key={`${item.label}-${item.href}`}>{item.label}</span>)}
                </div>
              </nav>
              <section className={`text-center ${device === 'mobile' ? 'px-5 py-12' : 'px-10 py-20'}`}>
                {config.branding.tagline ? <p className="text-sm font-bold" style={{ color: config.branding.secondaryColor }}>{config.branding.tagline}</p> : null}
                <h2 className={`${device === 'mobile' ? 'text-3xl' : 'text-5xl'} mt-3 font-black`}>{config.homepage.heroTitle}</h2>
                <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">{config.homepage.heroSubtitle}</p>
                <span className="mt-7 inline-block rounded-xl px-6 py-3 font-bold text-white" style={{ backgroundColor: config.branding.primaryColor }}>
                  {config.homepage.heroCtaText}
                </span>
                {config.homepage.features?.length ? (
                  <div className={`mt-10 grid gap-4 text-left ${device === 'desktop' ? 'grid-cols-3' : device === 'tablet' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {config.homepage.features.slice(0, 6).map((feature) => (
                      <article key={feature.title} className="rounded-xl border border-slate-200 bg-white p-5">
                        <h3 className="font-black text-slate-950">{feature.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">Preview uses the currently saved draft. Save editor changes before comparing device layouts.</p>
        </div>
      </section>
    </main>
  );
}
