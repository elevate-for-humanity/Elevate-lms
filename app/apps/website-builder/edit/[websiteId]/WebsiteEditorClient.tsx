'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles, Globe, ArrowLeft } from 'lucide-react';
import { tenantPublicSiteUrl } from '@/lib/tenant/public-site-url';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

type Props = {
  websiteId: string;
  siteName: string;
  subdomain: string | null;
  isPublished: boolean;
  initialConfig: TenantSiteConfig;
};

export function WebsiteEditorClient({
  websiteId,
  siteName: initialName,
  subdomain: initialSubdomain,
  isPublished: initialPublished,
  initialConfig,
}: Props) {
  const [siteName, setSiteName] = useState(initialName);
  const [heroTitle, setHeroTitle] = useState(initialConfig.homepage.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initialConfig.homepage.heroSubtitle);
  const [subdomain, setSubdomain] = useState(initialSubdomain ?? '');
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const saveConfig = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/websites/${websiteId}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteName,
        config: {
          homepage: { heroTitle, heroSubtitle },
          branding: { logoText: siteName },
        },
      }),
    });
    setBusy(false);
    setMessage(res.ok ? 'Saved.' : 'Save failed.');
  };

  const runAiGenerate = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/ai/generate-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationName: siteName,
        organizationType: 'Training Provider',
        websiteId,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? 'AI generation failed');
      return;
    }
    if (data.config?.homepage?.heroTitle) setHeroTitle(data.config.homepage.heroTitle);
    if (data.config?.homepage?.heroSubtitle) setHeroSubtitle(data.config.homepage.heroSubtitle);
    setMessage('AI content generated and saved.');
  };

  const publish = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/websites/${websiteId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? 'Publish failed');
      return;
    }
    setIsPublished(true);
    setMessage(`Live at ${data.publicUrl}`);
  };

  const previewUrl = subdomain ? tenantPublicSiteUrl(subdomain) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/apps/website-builder"
          className="inline-flex items-center gap-2 text-sm text-slate-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sites
        </Link>
        <h1 className="text-2xl font-bold mb-6">Edit website</h1>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Site name</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hero headline</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hero subheadline</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subdomain</label>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="acme-training"
              />
              <span className="text-sm text-slate-500">.app.elevateforhumanity.org</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={saveConfig}
              disabled={busy}
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
            <button
              type="button"
              onClick={runAiGenerate}
              disabled={busy}
              className="px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={busy || !subdomain}
              className="px-4 py-2 bg-brand-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Globe className="w-4 h-4" /> {isPublished ? 'Update publish' : 'Publish'}
            </button>
            {previewUrl && isPublished && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border rounded-lg text-sm font-medium"
              >
                View live site
              </a>
            )}
          </div>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}
