'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Mic, MicOff, Monitor, Save, Send, Smartphone, Sparkles, Tablet, Volume2 } from 'lucide-react';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

type Message = { role: 'user' | 'assistant'; content: string };
type Device = 'desktop' | 'tablet' | 'mobile';

const PREVIEW_WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 390 };

type SaveResponse = {
  website?: { site_name?: string; site_config?: TenantSiteConfig; is_published?: boolean };
  publicUrl?: string | null;
  validation?: { errors?: Array<{ message?: string }>; warnings?: Array<{ message?: string }> };
  error?: string;
};

function responseError(data: SaveResponse, fallback: string) {
  const blocking = data.validation?.errors?.map((issue) => issue.message).filter(Boolean) || [];
  return blocking.length ? `${data.error || fallback} ${blocking.slice(0, 3).join(' ')}` : data.error || fallback;
}

export function AutonomousWebsiteBuilder({
  websiteId,
  initialSiteName,
  initialSubdomain,
  initiallyPublished,
  initialConfig,
}: {
  websiteId: string;
  initialSiteName: string;
  initialSubdomain: string | null;
  initiallyPublished: boolean;
  initialConfig: TenantSiteConfig;
}) {
  const [config, setConfig] = useState(() => ensureComposableSiteConfig(initialConfig));
  const [siteName, setSiteName] = useState(initialSiteName);
  const [subdomain, setSubdomain] = useState(initialSubdomain || '');
  const [published, setPublished] = useState(initiallyPublished);
  const [selectedPage, setSelectedPage] = useState('/');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'I’m PARIS. Tell me what you want built or changed. I can create pages, add or remove sections, rewrite content, reorganize the site, change the visual brand, and publish when you explicitly tell me to go live.' },
  ]);
  const recognitionRef = useRef<any>(null);
  const naturalVoice = useNaturalVoice();

  const pages = config.pages || [];
  const page = pages.find((item) => item.slug === selectedPage) || pages[0];
  const publicUrl = subdomain && published ? `https://${subdomain}.app.elevateforhumanity.org` : '';
  const site = useMemo(() => ({ id: websiteId, subdomain: subdomain || '', siteName, organizationId: null, config }), [websiteId, subdomain, siteName, config]);

  async function persist(publish?: boolean) {
    const response = await fetch(`/api/apps/website-builder/sites/${websiteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteName, subdomain, ...(publish === undefined ? {} : { publish }), siteConfig: config }),
    });
    const data = await response.json() as SaveResponse;
    if (!response.ok) throw new Error(responseError(data, publish === true ? 'Could not publish website' : 'Could not save website'));
    if (data.website?.site_config) setConfig(ensureComposableSiteConfig(data.website.site_config));
    if (data.website?.site_name) setSiteName(data.website.site_name);
    if (publish === true) setPublished(true);
    if (publish === false) setPublished(false);
    return data;
  }

  async function runCommand(raw: string) {
    const clean = raw.trim();
    if (!clean || busy) return;
    setBusy(true); setError(''); setNotice('');
    setMessages((current) => [...current, { role: 'user', content: clean }]);
    setInstruction('');

    const explicitPublish = /\b(publish(?: it| the site| the website)?|go live|make (?:it|the site|the website) live)\b/i.test(clean);
    const explicitUnpublish = /\b(unpublish|take (?:it|the site|the website) offline|make (?:it|the site|the website) private)\b/i.test(clean);

    try {
      if (explicitUnpublish) {
        await persist(false);
        const reply = 'I took the website offline and preserved the draft, domain settings, and version history.';
        setMessages((current) => [...current, { role: 'assistant', content: reply }]);
        setNotice('Website unpublished.');
        return;
      }

      if (explicitPublish) {
        if (!subdomain.trim()) throw new Error('Choose a subdomain before asking me to publish.');
        await persist(true);
        const reply = 'I ran the pre-publish QA gate and published the website.';
        setMessages((current) => [...current, { role: 'assistant', content: reply }]);
        setNotice('Website published.');
        return;
      }

      const context = [
        page ? `The user is currently viewing page ${page.title} (${page.slug}).` : '',
        selectedSectionId ? `The currently selected section id is ${selectedSectionId}.` : '',
        clean,
      ].filter(Boolean).join('\n');

      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}/paris`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: context, conversation: messages.slice(-12) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'PARIS could not update the website');
      if (data.website?.site_config) setConfig(ensureComposableSiteConfig(data.website.site_config as TenantSiteConfig));
      if (data.website?.site_name) setSiteName(data.website.site_name);
      const reply = data.message || 'I updated the website.';
      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
      setNotice(`${data.operationsApplied || 0} website operation${data.operationsApplied === 1 ? '' : 's'} applied.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PARIS could not update the website';
      setError(message);
      setMessages((current) => [...current, { role: 'assistant', content: `I could not complete that change: ${message}` }]);
    } finally {
      setBusy(false);
    }
  }

  async function saveIdentity(publish = false) {
    setSaving(true); setError(''); setNotice('');
    try {
      await persist(publish ? true : undefined);
      setNotice(publish ? 'Website published.' : 'Website saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save website');
    } finally {
      setSaving(false);
    }
  }

  function toggleVoice() {
    if (typeof window === 'undefined') return;
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. Type your instruction instead.');
      return;
    }
    naturalVoice.stop();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
      if (transcript) void runCommand(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  async function speakLast() {
    const last = [...messages].reverse().find((item) => item.role === 'assistant');
    if (!last) return;
    if (naturalVoice.isPlaying || naturalVoice.isPaused || naturalVoice.isLoading) {
      naturalVoice.stop();
      return;
    }
    await naturalVoice.play(last.content, { voice: 'coral', style: 'assistant', rate: 0.96 });
  }

  const suggestions = [
    'Create an About page that explains our story and mission.',
    'Add an FAQ page based only on information already in this website.',
    'Improve this page for conversions without inventing claims.',
    'Make the design more polished and consistent across every page.',
  ];

  return (
    <div className="border-b border-slate-200 bg-slate-100">
      <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5">
        {(error || notice) ? <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</div> : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Site name</span><input value={siteName} onChange={(event) => setSiteName(event.target.value)} className="w-56 rounded-lg border border-slate-300 px-3 py-2 font-semibold" /></label>
            <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Subdomain</span><div className="flex items-center rounded-lg border border-slate-300 bg-white"><input value={subdomain} onChange={(event) => setSubdomain(event.target.value)} className="w-44 rounded-l-lg px-3 py-2 outline-none" /><span className="pr-3 text-xs text-slate-400">.app.elevateforhumanity.org</span></div></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={saving || busy} onClick={() => void saveIdentity(false)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-800 disabled:opacity-50"><Save className="h-4 w-4" /> Save</button>
            <button type="button" disabled={saving || busy} onClick={() => void saveIdentity(true)} className="rounded-lg bg-brand-red-600 px-4 py-2 font-black text-white disabled:opacity-50">{published ? 'Publish updates' : 'Publish'}</button>
            {publicUrl ? <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-800"><ExternalLink className="h-4 w-4" /> Live</a> : null}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_380px]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700">Pages</p>
            <div className="mt-3 space-y-2">{pages.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedPage(item.slug); setSelectedSectionId(null); }} className={`w-full rounded-xl px-3 py-3 text-left ${item.slug === page?.slug ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'}`}><span className="block font-black">{item.title}</span><span className={`mt-1 block text-xs ${item.slug === page?.slug ? 'text-slate-300' : 'text-slate-500'}`}>{item.slug}</span></button>)}</div>
            {page ? <div className="mt-5 border-t border-slate-200 pt-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Sections</p><div className="mt-2 space-y-1.5">{page.sections.map((section, index) => <button key={section.id} type="button" onClick={() => setSelectedSectionId(section.id)} className={`w-full rounded-lg px-3 py-2 text-left text-xs font-bold ${selectedSectionId === section.id ? 'bg-brand-red-50 text-brand-red-800 ring-1 ring-brand-red-200' : 'bg-slate-50 text-slate-600'}`}>{index + 1}. {section.type.replaceAll('_', ' ')}</button>)}</div></div> : null}
          </aside>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Live visual draft · {page?.title}</span>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 bg-white p-0.5" aria-label="Preview device">
                  {([
                    ['desktop', Monitor, 'Desktop'],
                    ['tablet', Tablet, 'Tablet'],
                    ['mobile', Smartphone, 'Mobile'],
                  ] as const).map(([id, Icon, label]) => (
                    <button key={id} type="button" onClick={() => setDevice(id)} aria-label={`Preview on ${label}`} aria-pressed={device === id} className={`rounded-md p-1.5 ${device === id ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                <Link href={`/apps/website-builder/edit/${websiteId}/preview`} className="text-xs font-black text-brand-red-700 hover:underline">Full preview</Link>
              </div>
            </div>
            <div className="max-h-[820px] overflow-auto bg-slate-100 p-2 sm:p-4">
              <div className="mx-auto overflow-hidden bg-white shadow-sm transition-[width] duration-200" style={{ width: `min(100%, ${PREVIEW_WIDTHS[device]}px)` }}>
                <PublicTenantComposableSite site={site} pathname={page?.slug || '/'} />
              </div>
            </div>
          </section>

          <aside className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border border-brand-red-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-red-100 bg-brand-red-50 px-4 py-3"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red-600 text-white"><Sparkles className="h-4 w-4" /></span><div><p className="font-black text-slate-950">PARIS Autonomous Builder</p><p className="text-xs font-semibold text-slate-600">Command the website. PARIS changes it.</p></div></div><button type="button" onClick={() => void speakLast()} className="rounded-lg border border-brand-red-200 bg-white p-2 text-brand-red-700"><Volume2 className="h-4 w-4" /></button></div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.map((item, index) => <div key={`${item.role}-${index}`} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === 'user' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{item.content}</div></div>)}</div>
            <div className="border-t border-slate-200 p-3"><div className="mb-2 flex flex-wrap gap-1.5">{suggestions.map((suggestion) => <button key={suggestion} type="button" disabled={busy} onClick={() => void runCommand(suggestion)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-brand-red-200 hover:text-brand-red-700 disabled:opacity-50">{suggestion}</button>)}</div>{selectedSectionId ? <p className="mb-2 rounded-lg bg-brand-red-50 px-3 py-2 text-xs font-bold text-brand-red-800">Selected section: {selectedSectionId}. Your next command will target it unless you say otherwise.</p> : null}<div className="flex gap-2"><textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void runCommand(instruction); } }} rows={3} placeholder="Tell PARIS what to build or change…" className="min-h-[82px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red-500" /><div className="flex flex-col gap-2"><button type="button" onClick={toggleVoice} className={`rounded-xl p-3 ${listening ? 'bg-brand-red-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button><button type="button" disabled={busy || !instruction.trim()} onClick={() => void runCommand(instruction)} className="rounded-xl bg-slate-950 p-3 text-white disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div></div></div>
          </aside>
        </div>
      </div>
    </div>
  );
}
