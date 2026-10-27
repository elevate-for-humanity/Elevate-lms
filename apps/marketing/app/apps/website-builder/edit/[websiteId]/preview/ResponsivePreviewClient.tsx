'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Monitor, Smartphone, Tablet } from 'lucide-react';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { TenantDraftViewport } from '@/components/website-builder/TenantDraftViewport';
import { TenantPreviewProvider } from '@/components/tenant/TenantPreviewContext';

type Device = 'desktop' | 'tablet' | 'mobile';
const widths: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 390 };

export function ResponsivePreviewClient({ websiteId, siteName, config: initialConfig, pageSlug = '/', parisEnabled = false, initialDevice = 'desktop' }: { websiteId: string; siteName: string; config: TenantSiteConfig; pageSlug?: string; parisEnabled?: boolean; initialDevice?: Device }) {
  const [device, setDevice] = useState<Device>(initialDevice);
  const config = useMemo(() => ensureComposableSiteConfig(initialConfig), [initialConfig]);
  const site = useMemo(() => ({ id: websiteId, subdomain: '', siteName, organizationId: null, config, parisEnabled }), [websiteId, siteName, config, parisEnabled]);
  const reviewHref = (slug: string) => `/apps/website-builder/edit/${websiteId}/preview?page=${encodeURIComponent(slug)}${device === 'desktop' ? '' : `&device=${device}`}`;
  function navigate(slug: string) { window.location.assign(reviewHref(slug)); }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <a href={`/apps/website-builder/edit/${websiteId}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to builder</a>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Responsive preview · {siteName}</h1>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {([['desktop', Monitor, 'Desktop'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Mobile']] as const).map(([id, Icon, label]) => (
              <button key={id} type="button" onClick={() => setDevice(id)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${device === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white'}`}><Icon className="h-4 w-4" /> {label}</button>
            ))}
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4">
          {(config.pages || []).map((page) => <a key={page.id} href={reviewHref(page.slug)} aria-current={pageSlug === page.slug ? 'page' : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${pageSlug === page.slug ? 'bg-brand-red-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{page.title}</a>)}
        </div>
      </header>

      <section className="overflow-auto px-4 py-8">
        <div className="mx-auto transition-[width] duration-200" style={{ width: widths[device] }}>
          <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs font-bold text-slate-500">{device.toUpperCase()} · {widths[device]}px · {pageSlug}</div>
            <TenantPreviewProvider websiteId={websiteId}><TenantDraftViewport key={pageSlug} width={widths[device]} title={`${siteName} ${device} preview`}><PublicTenantComposableSite site={site} pathname={pageSlug} basePath={`/apps/website-builder/edit/${websiteId}/preview?page=`} onNavigate={navigate} /></TenantDraftViewport></TenantPreviewProvider>
          </div>
          <p role="status" className="mt-4 text-center text-xs text-slate-500">Private review · Sign-in and project access required. Desktop, tablet, and mobile previews use the selected screen width. Contact forms send to the business.</p>
        </div>
      </section>
    </main>
  );
}
