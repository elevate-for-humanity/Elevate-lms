'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, Pencil, Globe2, Upload, Sparkles, X } from 'lucide-react';
import { ParisWebsiteInterview } from '@/components/store/ParisWebsiteInterview';

type WebsiteRow = {
  id: string;
  site_name?: string | null;
  subdomain?: string | null;
  is_published?: boolean | null;
  updated_at?: string | null;
};

type SubscriptionRow = {
  status?: string | null;
  plan?: string | null;
  trial_ends_at?: string | null;
};

interface Props {
  user: { id: string; email?: string | null };
  subscription: SubscriptionRow;
  websites: WebsiteRow[];
  trialDaysRemaining: number;
}

export function WebsiteBuilderApp({ subscription, websites: initialWebsites, trialDaysRemaining }: Props) {
  const [websites, setWebsites] = useState(initialWebsites);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInterview, setShowInterview] = useState(initialWebsites.length === 0);

  const createWebsite = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/apps/website-builder/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName: `My Website ${websites.length + 1}` }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create website');
      window.location.href = `/apps/website-builder/edit/${data.website.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create website');
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-red-700">Elevate Apps</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">AI Website Builder</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              PARIS interviews you, turns your answers into a website brief, generates the first draft, and opens it in the editor for review and publishing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowInterview(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-bold text-white hover:bg-brand-red-700">
              <Sparkles className="h-5 w-5" /> Build with PARIS
            </button>
            {websites.length > 0 ? (
              <button type="button" onClick={createWebsite} disabled={creating} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60">
                <Plus className="h-5 w-5" /> {creating ? 'Creating…' : 'Blank Website'}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">Plan: {subscription.plan || 'starter'}</span>
          <span className="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">Status: {subscription.status || 'unknown'}</span>
          {subscription.status === 'trial' && (
            <span className="rounded-full bg-amber-50 px-4 py-2 font-semibold text-amber-800 ring-1 ring-amber-200">{Math.max(0, trialDaysRemaining)} trial days remaining</span>
          )}
        </div>

        {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}

        {showInterview ? (
          <section id="paris-website-interview" className="mt-8 rounded-3xl border border-brand-red-200 bg-brand-red-50/40 p-3 sm:p-5">
            {websites.length > 0 ? (
              <div className="mb-3 flex justify-end">
                <button type="button" onClick={() => setShowInterview(false)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-900" aria-label="Close PARIS interview">
                  <X className="h-4 w-4" /> Close
                </button>
              </div>
            ) : null}
            <ParisWebsiteInterview onCreated={(website) => { setWebsites((current) => [website, ...current]); setShowInterview(false); }} />
          </section>
        ) : null}

        {websites.length === 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Link href="/apps/website-builder/import" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-red-300 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red-50 text-brand-red-700"><Upload className="h-5 w-5" /></div>
              <h2 className="mt-4 text-xl font-black text-slate-950">Import an existing website</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Bring a public site into the Elevate builder, let AI map its content and branding, then review everything before publishing.</p>
              <span className="mt-5 inline-flex font-black text-brand-red-700 group-hover:underline">Start import →</span>
            </Link>

            <button type="button" onClick={createWebsite} disabled={creating} className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-slate-300 hover:shadow-md disabled:opacity-60">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800"><Globe2 className="h-5 w-5" /></div>
              <h2 className="mt-4 text-xl font-black text-slate-950">Start manually</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Open a clean starter website and edit branding, homepage, contact, booking, SEO, domains, and publishing settings yourself.</p>
              <span className="mt-5 inline-flex font-black text-slate-950">{creating ? 'Creating…' : 'Create blank starter →'}</span>
            </button>
          </div>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {websites.map((site) => {
              const liveUrl = site.subdomain && site.is_published ? `https://${site.subdomain}.app.elevateforhumanity.org` : null;
              return (
                <article key={site.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${site.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{site.is_published ? 'Published' : 'Draft'}</span>
                      <h2 className="mt-4 text-xl font-black text-slate-900">{site.site_name || 'Untitled Website'}</h2>
                    </div>
                    <Globe2 className="h-6 w-6 text-brand-red-700" />
                  </div>
                  <div className="mt-4 space-y-1 text-sm text-slate-600">
                    <p>{site.subdomain ? `${site.subdomain}.app.elevateforhumanity.org` : 'Subdomain not selected'}</p>
                    <p>{site.is_published ? 'Public tenant site is enabled' : 'Private draft — not visible publicly'}</p>
                    {site.updated_at ? <p className="text-xs text-slate-400">Updated {new Date(site.updated_at).toLocaleString()}</p> : null}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link href={`/apps/website-builder/edit/${site.id}`} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"><Pencil className="h-4 w-4" /> Edit</Link>
                    {liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"><ExternalLink className="h-4 w-4" /> Live site</a>}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-brand-red-200 bg-brand-red-50 p-6">
            <div className="flex items-center gap-2 text-brand-red-700"><Sparkles className="h-5 w-5" /><h2 className="text-lg font-black">Build another site with PARIS</h2></div>
            <p className="mt-2 text-sm leading-6 text-slate-700">Run the interview again for another business, program, service, or campaign. PARIS creates a separate draft instead of overwriting an existing site.</p>
            <button type="button" onClick={() => setShowInterview(true)} className="mt-4 inline-flex font-black text-brand-red-700 hover:underline">Start another interview →</button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black text-slate-900">Need more sites or advanced capacity?</h2>
            <p className="mt-2 text-sm text-slate-600">Compare Website Builder plans and organization-level platform options in the Store.</p>
            <div className="mt-4 flex flex-wrap gap-3"><Link href="/store/apps/website-builder" className="font-bold text-brand-red-700 hover:underline">Website Builder plans</Link><Link href="/store/plans" className="font-bold text-brand-red-700 hover:underline">Platform plans</Link></div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default WebsiteBuilderApp;
