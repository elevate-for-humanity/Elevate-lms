'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Mic, MicOff, Send, Sparkles, Volume2 } from 'lucide-react';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { DomainPanel } from '@/components/website-builder/DomainPanel';

interface Props {
  websiteId: string;
  siteName: string;
  subdomain: string | null;
  isPublished: boolean;
  initialConfig: TenantSiteConfig;
}

type ParisMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function WebsiteEditorClient({
  websiteId,
  siteName: initialSiteName,
  subdomain: initialSubdomain,
  isPublished: initiallyPublished,
  initialConfig,
}: Props) {
  const [baseConfig, setBaseConfig] = useState(initialConfig);
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

  const [parisInput, setParisInput] = useState('');
  const [parisBusy, setParisBusy] = useState(false);
  const [parisListening, setParisListening] = useState(false);
  const [parisError, setParisError] = useState<string | null>(null);
  const [parisMessages, setParisMessages] = useState<ParisMessage[]>([
    {
      role: 'assistant',
      content: 'I’m PARIS. Keep telling me what you want as you build. I can change your branding, homepage copy, services, navigation, footer and SEO while you watch the preview update.',
    },
  ]);
  const recognitionRef = useRef<any>(null);

  function applyConfigToEditor(config: TenantSiteConfig, nextSiteName?: string | null) {
    setBaseConfig(config);
    if (nextSiteName) setSiteName(nextSiteName);
    setLogoText(config.branding.logoText || nextSiteName || siteName);
    setTagline(config.branding.tagline || '');
    setPrimaryColor(config.branding.primaryColor || '#1d4ed8');
    setSecondaryColor(config.branding.secondaryColor || '#0f172a');
    setHeroTitle(config.homepage.heroTitle || '');
    setHeroSubtitle(config.homepage.heroSubtitle || '');
    setHeroCtaText(config.homepage.heroCtaText || '');
    setSeoTitle(config.seo?.title || nextSiteName || siteName);
    setSeoDescription(config.seo?.description || '');
  }

  function buildCurrentConfig(): TenantSiteConfig {
    return {
      ...baseConfig,
      branding: {
        ...baseConfig.branding,
        logoText,
        tagline,
        primaryColor,
        secondaryColor,
      },
      homepage: {
        ...baseConfig.homepage,
        heroTitle,
        heroSubtitle,
        heroCtaText,
      },
      seo: {
        title: seoTitle,
        description: seoDescription,
        keywords: baseConfig.seo?.keywords || [],
      },
    };
  }

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
          siteConfig: buildCurrentConfig(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save website');
      if (data.website?.site_config) {
        applyConfigToEditor(data.website.site_config as TenantSiteConfig, data.website.site_name);
      }
      if (publish) setPublished(true);
      if (data.publicUrl) setPublicUrl(data.publicUrl);
      setMessage(publish ? 'Website published.' : 'Changes saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save website');
    } finally {
      setBusy(false);
    }
  };

  async function runParisInstruction(rawInstruction: string) {
    const instruction = rawInstruction.trim();
    if (!instruction || parisBusy) return;

    const priorConversation = parisMessages.slice(-8);
    setParisMessages((current) => [...current, { role: 'user', content: instruction }]);
    setParisInput('');
    setParisBusy(true);
    setParisError(null);
    setMessage(null);
    setError(null);

    try {
      // Persist any manual fields the user changed before asking PARIS so the AI
      // always edits the newest version instead of an older database snapshot.
      const currentConfig = buildCurrentConfig();
      const syncResponse = await fetch(`/api/apps/website-builder/sites/${websiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName, siteConfig: currentConfig }),
      });
      const syncBody = await syncResponse.json();
      if (!syncResponse.ok) throw new Error(syncBody.error || 'Could not prepare the current website for PARIS');
      if (syncBody.website?.site_config) {
        setBaseConfig(syncBody.website.site_config as TenantSiteConfig);
      }

      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}/paris`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          conversation: priorConversation,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'PARIS could not update the website');

      if (data.website?.site_config) {
        applyConfigToEditor(data.website.site_config as TenantSiteConfig, data.website.site_name);
      }
      setParisMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.message || 'I updated your website draft. Keep telling me what you want next.',
        },
      ]);
      setMessage('PARIS updated and saved your draft.');
    } catch (err) {
      const text = err instanceof Error ? err.message : 'PARIS could not update the website';
      setParisError(text);
      setParisMessages((current) => [...current, { role: 'assistant', content: `I could not make that change: ${text}` }]);
    } finally {
      setParisBusy(false);
    }
  }

  function speakLastParisMessage() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const last = [...parisMessages].reverse().find((item) => item.role === 'assistant');
    if (!last) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(last.content);
    utterance.rate = 0.96;
    utterance.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => /Aria|Jenny|Samantha|Google US English/i.test(voice.name))
      || voices.find((voice) => voice.lang === 'en-US')
      || voices.find((voice) => voice.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }

  function toggleParisVoice() {
    if (typeof window === 'undefined') return;
    if (parisListening) {
      recognitionRef.current?.stop?.();
      setParisListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setParisError('Voice input is not supported in this browser. Type your request to PARIS instead.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setParisListening(true);
    recognition.onend = () => setParisListening(false);
    recognition.onerror = () => setParisListening(false);
    recognition.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
      if (transcript) void runParisInstruction(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  const suggestions = [
    'Make this website look more professional and trustworthy.',
    'Rewrite my homepage so customers understand what I offer immediately.',
    'Improve my SEO title, description and keywords.',
    'Organize my services and navigation so the site is easier to use.',
  ];

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
            <button type="button" disabled={busy || parisBusy} onClick={() => save(false)} className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button type="button" disabled={busy || parisBusy} onClick={() => save(true)} className="rounded-lg bg-brand-red-600 px-4 py-2 font-bold text-white disabled:opacity-60">
              {published ? 'Publish updates' : 'Publish'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_440px]">
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
            <h2 className="text-xl font-black text-slate-900">Brand colors</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ColorField label="Primary color" value={primaryColor} onChange={setPrimaryColor} />
              <ColorField label="Secondary color" value={secondaryColor} onChange={setSecondaryColor} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Search visibility</h2>
            <div className="mt-5 space-y-4">
              <Field label="SEO title" value={seoTitle} onChange={setSeoTitle} />
              <TextArea label="SEO description" value={seoDescription} onChange={setSeoDescription} />
            </div>
          </div>

          <DomainPanel websiteId={websiteId} isPublished={published} />
        </section>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="overflow-hidden rounded-2xl border border-brand-red-200 bg-white shadow-lg">
            <div className="flex items-center justify-between gap-3 border-b border-brand-red-100 bg-brand-red-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-black text-slate-950">PARIS Website Copilot</p>
                  <p className="text-xs font-semibold text-slate-600">Tell me. I build it. Your draft saves automatically.</p>
                </div>
              </div>
              <button type="button" onClick={speakLastParisMessage} className="rounded-lg border border-brand-red-200 bg-white p-2 text-brand-red-700" aria-label="Read PARIS response aloud">
                <Volume2 className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[310px] space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
              {parisMessages.map((item, index) => (
                <div key={`${item.role}-${index}`} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === 'user' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                    {item.content}
                  </div>
                </div>
              ))}
              {parisBusy && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-brand-red-200 bg-white px-4 py-3 text-sm font-semibold text-brand-red-700">
                    <Loader2 className="h-4 w-4 animate-spin" /> PARIS is building your changes…
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4">
              {parisError && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{parisError}</div>}
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" disabled={parisBusy} onClick={() => void runParisInstruction(suggestion)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-semibold text-slate-600 hover:border-brand-red-300 hover:text-brand-red-700 disabled:opacity-50">
                    {suggestion}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={parisInput}
                  onChange={(event) => setParisInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void runParisInstruction(parisInput);
                    }
                  }}
                  rows={3}
                  placeholder="Tell PARIS what you want changed…"
                  className="min-h-[84px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-red-500"
                />
                <div className="flex flex-col gap-2">
                  <button type="button" disabled={parisBusy} onClick={toggleParisVoice} className={`flex h-10 w-10 items-center justify-center rounded-xl border ${parisListening ? 'border-brand-red-600 bg-brand-red-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`} aria-label={parisListening ? 'Stop voice request' : 'Tell PARIS by voice'}>
                    {parisListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button type="button" disabled={parisBusy || !parisInput.trim()} onClick={() => void runParisInstruction(parisInput)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red-600 text-white disabled:opacity-40" aria-label="Send request to PARIS">
                    {parisBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">PARIS changes the draft, not the live site. Publishing remains your decision.</p>
            </div>
          </section>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Live preview</div>
            <div style={{ backgroundColor: baseConfig.branding.backgroundColor || '#ffffff', color: baseConfig.branding.textColor || '#0f172a' }}>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <strong style={{ color: primaryColor }}>{logoText || siteName}</strong>
                <span className="text-xs text-slate-500">{baseConfig.navigation.slice(0, 3).map((item) => item.label).join(' · ') || 'Programs · About · Contact'}</span>
              </div>
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-semibold" style={{ color: secondaryColor }}>{tagline}</p>
                <h2 className="mt-3 text-3xl font-black">{heroTitle}</h2>
                <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-600">{heroSubtitle}</p>
                <span className="mt-6 inline-block rounded-lg px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: primaryColor }}>
                  {heroCtaText}
                </span>
                {baseConfig.homepage.features?.length ? (
                  <div className="mt-8 grid gap-2 text-left">
                    {baseConfig.homepage.features.slice(0, 3).map((feature) => (
                      <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-3">
                        <p className="text-xs font-bold text-slate-900">{feature.title}</p>
                        <p className="mt-1 text-[11px] leading-4 text-slate-500">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#1d4ed8'} onChange={(event) => onChange(event.target.value)} className="h-11 w-14 rounded-lg border border-slate-300 bg-white p-1" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-brand-red-500" />
      </div>
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
