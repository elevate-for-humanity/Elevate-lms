'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

interface Props {
  websiteId: string;
  siteName: string;
  subdomain: string | null;
  isPublished: boolean;
  initialConfig: TenantSiteConfig;
}

export function WebsiteEditorClient({
  websiteId,
  siteName: initialSiteName,
  subdomain: initialSubdomain,
  isPublished: initiallyPublished,
  initialConfig,
}: Props) {
  const [siteName, setSiteName] = useState(initialSiteName);
  const [subdomain, setSubdomain] = useState(initialSubdomain || '');
  const [heroTitle, setHeroTitle] = useState(initialConfig.homepage.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initialConfig.homepage.heroSubtitle);
  const [heroCtaText, setHeroCtaText] = useState(initialConfig.homepage.heroCtaText);
  const [logoText, setLogoText] = useState(initialConfig.branding.logoText);
  const [tagline, setTagline] = useState(initialConfig.branding.tagline || '');
  const [primaryColor, setPrimaryColor] = useState(initialConfig.branding.primaryColor || '#1d4ed8');
  const [secondaryColor, setSecondaryColor] = useState(initialConfig.branding.secondaryColor || '#0f172a');
  const [seoTitle, setSeoTitle] = useState(initialConfig.seo?.title || initialSiteName);
  const [seoDescription, setSeoDescription] = useState(initialConfig.seo?.description || '');
  const [published, setPublished] = useState(initiallyPublished);
  const [publicUrl, setPublicUrl] = useState(initialSubdomain && initiallyPublished ? `https://${initialSubdomain}.app.elevateforhumanity.org` : '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async (publish = false) => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName,
          subdomain,
          publish,
          siteConfig: {
            branding: {
              ...initialConfig.branding,
              logoText,
              tagline,
              primaryColor,
              secondaryColor,
            },
            homepage: {
              ...initialConfig.homepage,
              heroTitle,
              heroSubtitle,
              heroCtaText,
            },
            seo: {
              title: seoTitle,
              description: seoDescription,
              keywords: initialConfig.seo?.keywords || [],
            },
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save website');
      if (publish) setPublished(true);
      if (data.publicUrl) setPublicUrl(data.publicUrl);
      setMessage(publish ? 'Website published.' : 'Changes saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save website');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-700">Website Builder</p>
            <h1 className="text-2xl font-black text-slate-900">Edit {siteName || 'website'}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/apps/website-builder" className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">
              Back to sites
            </Link>
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">
                View live site
              </a>
            )}
            <button type="button" disabled={busy} onClick={() => save(false)} className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button type="button" disabled={busy} onClick={() => save(true)} className="rounded-lg bg-brand-red-600 px-4 py-2 font-bold text-white disabled:opacity-60">
              {published ? 'Publish updates' : 'Publish'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          {(message || error) && (
            <div className={`rounded-xl border p-4 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
              {error || message}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Site identity</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Site name" value={siteName} onChange={setSiteName} />
              <Field label="Subdomain" value={subdomain} onChange={setSubdomain} help="Use letters, numbers, and hyphens." />
              <Field label="Logo text" value={logoText} onChange={setLogoText} />
              <Field label="Tagline" value={tagline} onChange={setTagline} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Homepage hero</h2>
            <div className="mt-5 space-y-4">
              <Field label="Headline" value={heroTitle} onChange={setHeroTitle} />
              <TextArea label="Supporting text" value={heroSubtitle} onChange={setHeroSubtitle} />
              <Field label="Call-to-action text" value={heroCtaText} onChange={setHeroCtaText} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Search visibility</h2>
            <div className="mt-5 space-y-4">
              <Field label="SEO title" value={seoTitle} onChange={setSeoTitle} />
              <TextArea label="SEO description" value={seoDescription} onChange={setSeoDescription} />
            </div>
          </div>
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Live preview</div>
            <div style={{ backgroundColor: initialConfig.branding.backgroundColor || '#ffffff', color: initialConfig.branding.textColor || '#0f172a' }}>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <strong style={{ color: primaryColor }}>{logoText || siteName}</strong>
                <span className="text-xs text-slate-500">Programs · About · Contact</span>
              </div>
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-semibold" style={{ color: secondaryColor }}>{tagline}</p>
                <h2 className="mt-3 text-3xl font-black">{heroTitle}</h2>
                <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-600">{heroSubtitle}</p>
                <span className="mt-6 inline-block rounded-lg px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: primaryColor }}>
                  {heroCtaText}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, help }: { label: string; value: string; onChange: (value: string) => void; help?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-brand-red-500" />
      {help && <span className="mt-1 block text-xs text-slate-500">{help}</span>}
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-brand-red-500" />
    </label>
  );
}

export default WebsiteEditorClient;
