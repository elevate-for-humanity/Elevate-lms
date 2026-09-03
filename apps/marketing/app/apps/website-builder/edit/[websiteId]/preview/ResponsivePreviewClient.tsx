'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Monitor, Smartphone, Tablet } from 'lucide-react';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';

type Device = 'desktop' | 'tablet' | 'mobile';
const widths: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 390 };

export function ResponsivePreviewClient({ websiteId, siteName, config: initialConfig }: { websiteId: string; siteName: string; config: TenantSiteConfig }) {
  const [device, setDevice] = useState<Device>('desktop');
  const config = useMemo(() => ensureComposableSiteConfig(initialConfig), [initialConfig]);
  const [pageSlug, setPageSlug] = useState(config.pages?.[0]?.slug || '/');
  const site = useMemo(() => ({ id: websiteId, subdomain: '', siteName, organizationId: null, config }), [websiteId, siteName, config]);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link href={`/apps/website-builder/edit/${websiteId}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to builder</Link>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Responsive preview · {siteName}</h1>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {([['desktop', Monitor, 'Desktop'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Mobile']] as const).map(([id, Icon, label]) => (
              <button key={id} type="button" onClick={() => setDevice(id)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${device === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white'}`}><Icon className="h-4 w-4" /> {label}</button>
            ))}
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4">
          {(config.pages || []).map((page) => <button key={page.id} type="button" onClick={() => setPageSlug(page.slug)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${pageSlug === page.slug ? 'bg-brand-red-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{page.title}</button>)}
        </div>
      </header>

      <section className="overflow-auto px-4 py-8">
        <div className="mx-auto transition-[width] duration-200" style={{ width: `min(100%, ${widths[device]}px)` }}>
          <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs font-bold text-slate-500">{device.toUpperCase()} · {widths[device]}px · {pageSlug}</div>
            <PublicTenantComposableSite site={site} pathname={pageSlug} />
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">This preview uses the same page-and-section renderer as the published website.</p>
        </div>
      </section>
    </main>
  );
}
