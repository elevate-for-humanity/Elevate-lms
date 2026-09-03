'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import type { TenantSiteConfig, TenantSitePage, TenantSiteSection, TenantSiteSectionType } from '@/lib/tenant/site-types';
import { ensureComposableSiteConfig, normalizePageSlug } from '@/lib/tenant/site-composition';

const SECTION_TYPES: TenantSiteSectionType[] = [
  'hero', 'rich_text', 'features', 'services', 'products', 'gallery', 'image', 'video',
  'faq', 'team', 'pricing', 'cta', 'contact_form', 'booking',
];

function sectionPreset(type: TenantSiteSectionType, index: number): TenantSiteSection {
  const base = { id: `section_${Date.now()}_${index}`, type, visible: true, settings: {} } as TenantSiteSection;
  switch (type) {
    case 'hero': return { ...base, content: { eyebrow: 'New section', title: 'Add a clear headline', text: 'Describe what visitors should know.', buttonText: 'Learn more', buttonHref: '/contact' } };
    case 'rich_text': return { ...base, content: { title: 'Section title', text: 'Add your content here.' } };
    case 'features': return { ...base, content: { title: 'Highlights', items: [{ title: 'Highlight one', description: 'Explain the value.' }, { title: 'Highlight two', description: 'Explain the value.' }, { title: 'Highlight three', description: 'Explain the value.' }] } };
    case 'services': return { ...base, content: { title: 'Services', items: [{ title: 'Service one', description: 'Describe this service.' }] } };
    case 'products': return { ...base, content: { title: 'Products', items: [] } };
    case 'gallery': return { ...base, content: { title: 'Gallery', items: [] } };
    case 'image': return { ...base, content: { image: '', alt: '', caption: '' } };
    case 'video': return { ...base, content: { title: 'Video', url: '' } };
    case 'faq': return { ...base, content: { title: 'Frequently asked questions', items: [{ question: 'Question', answer: 'Answer' }] } };
    case 'team': return { ...base, content: { title: 'Meet the team', items: [] } };
    case 'pricing': return { ...base, content: { title: 'Pricing', items: [] } };
    case 'cta': return { ...base, content: { title: 'Ready to get started?', text: 'Tell visitors what to do next.', buttonText: 'Contact us', buttonHref: '/contact' } };
    case 'contact_form': return { ...base, content: { title: 'Send a message', fields: [{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'message', label: 'Message', type: 'textarea', required: true }] } };
    case 'booking': return { ...base, content: { title: 'Book an appointment', text: 'Choose a time that works for you.', bookingUrl: '' } };
    default: return { ...base, content: {} };
  }
}

function pageId() { return `page_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

export function ZeroCodeStructureEditor({ websiteId, initialConfig }: { websiteId: string; initialConfig: TenantSiteConfig }) {
  const [config, setConfig] = useState(() => ensureComposableSiteConfig(initialConfig));
  const [selectedPage, setSelectedPage] = useState('/');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newSectionType, setNewSectionType] = useState<TenantSiteSectionType>('rich_text');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const pages = config.pages || [];
  const page = pages.find((item) => item.slug === selectedPage) || pages[0];
  const selectedSection = page?.sections.find((section) => section.id === selectedSectionId) || null;
  const selectedSectionIndex = page && selectedSection ? page.sections.findIndex((section) => section.id === selectedSection.id) : -1;

  async function persist(next: TenantSiteConfig, notice = 'Website structure saved.') {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteConfig: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save website');
      const saved = data.website?.site_config ? ensureComposableSiteConfig(data.website.site_config as TenantSiteConfig) : ensureComposableSiteConfig(next);
      setConfig(saved); setMessage(notice);
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save website');
      return null;
    } finally { setBusy(false); }
  }

  function replacePage(nextPage: TenantSitePage) {
    return ensureComposableSiteConfig({ ...config, pages: pages.map((item) => item.id === nextPage.id ? nextPage : item) });
  }

  async function addPage() {
    const title = newPageTitle.trim();
    if (!title) return;
    let slug = normalizePageSlug(title);
    if (pages.some((item) => item.slug === slug)) slug = normalizePageSlug(`${title}-${pages.length + 1}`);
    const nextPage: TenantSitePage = { id: pageId(), slug, title, navLabel: title, showInNavigation: true, seo: { title, description: '' }, sections: [sectionPreset('hero', 0)] };
    const saved = await persist(ensureComposableSiteConfig({ ...config, pages: [...pages, nextPage] }), `Added ${title}.`);
    if (saved) { setSelectedPage(slug); setSelectedSectionId(null); setNewPageTitle(''); }
  }

  async function renamePage(title: string) {
    if (!page) return;
    const clean = title.trim(); if (!clean) return;
    const nextPage = { ...page, title: clean, navLabel: clean, seo: { ...page.seo, title: page.seo?.title || clean } };
    await persist(replacePage(nextPage), 'Page name updated.');
  }

  async function removePage() {
    if (!page || page.slug === '/') return;
    if (!window.confirm(`Delete the ${page.title} page?`)) return;
    const remaining = pages.filter((item) => item.id !== page.id);
    const saved = await persist(ensureComposableSiteConfig({ ...config, pages: remaining }), `${page.title} removed.`);
    if (saved) { setSelectedPage('/'); setSelectedSectionId(null); }
  }

  async function addSection() {
    if (!page) return;
    const nextPage = { ...page, sections: [...page.sections, sectionPreset(newSectionType, page.sections.length)] };
    const saved = await persist(replacePage(nextPage), `${newSectionType.replaceAll('_', ' ')} section added.`);
    if (saved) {
      const fresh = saved.pages?.find((item) => item.id === page.id);
      setSelectedSectionId(fresh?.sections.at(-1)?.id || null);
    }
  }

  async function removeSection() {
    if (!page || !selectedSection) return;
    if (!window.confirm('Remove this section?')) return;
    const nextPage = { ...page, sections: page.sections.filter((section) => section.id !== selectedSection.id) };
    const saved = await persist(replacePage(nextPage), 'Section removed.');
    if (saved) setSelectedSectionId(null);
  }

  async function moveSection(delta: number) {
    if (!page || !selectedSection || selectedSectionIndex < 0) return;
    const target = selectedSectionIndex + delta;
    if (target < 0 || target >= page.sections.length) return;
    const sections = [...page.sections];
    const [moved] = sections.splice(selectedSectionIndex, 1);
    sections.splice(target, 0, moved);
    await persist(replacePage({ ...page, sections }), 'Section order updated.');
  }

  async function updateSectionField(key: string, value: string) {
    if (!page || !selectedSection) return;
    const nextSection = { ...selectedSection, content: { ...selectedSection.content, [key]: value } };
    const nextPage = { ...page, sections: page.sections.map((section) => section.id === selectedSection.id ? nextSection : section) };
    await persist(replacePage(nextPage), 'Section content updated.');
  }

  const fieldValues = useMemo(() => {
    const c = selectedSection?.content || {};
    return {
      title: typeof c.title === 'string' ? c.title : '',
      text: typeof c.text === 'string' ? c.text : '',
      image: typeof c.image === 'string' ? c.image : '',
      imageAlt: typeof c.imageAlt === 'string' ? c.imageAlt : typeof c.alt === 'string' ? c.alt : '',
      buttonText: typeof c.buttonText === 'string' ? c.buttonText : '',
      buttonHref: typeof c.buttonHref === 'string' ? c.buttonHref : '',
    };
  }, [selectedSection]);

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <details className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5" open>
          <summary className="cursor-pointer text-lg font-black text-slate-950">Zero-code page & section editor</summary>
          <p className="mt-2 text-sm leading-6 text-slate-600">Build the site with buttons and fields. PARIS remains available for autonomous changes, but routine website editing does not require prompts or code.</p>
          {(message || error) ? <div className={`mt-4 rounded-xl border p-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || message}</div> : null}

          <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="font-black">Pages</h2>
              <div className="mt-3 space-y-2">{pages.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedPage(item.slug); setSelectedSectionId(null); }} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold ${item.slug === page?.slug ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-700'}`}>{item.title}<span className="ml-2 text-xs opacity-60">{item.slug}</span></button>)}</div>
              <div className="mt-4 flex gap-2"><input value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} placeholder="New page name" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button type="button" disabled={busy || !newPageTitle.trim()} onClick={() => void addPage()} className="rounded-lg bg-slate-950 p-2 text-white disabled:opacity-40" aria-label="Add page"><Plus className="h-4 w-4" /></button></div>
              {page ? <div className="mt-4 space-y-2 border-t border-slate-200 pt-4"><label className="block text-xs font-black uppercase tracking-wide text-slate-500">Page name</label><input key={page.id} defaultValue={page.title} onBlur={(e) => { if (e.target.value.trim() && e.target.value.trim() !== page.title) void renamePage(e.target.value); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />{page.slug !== '/' ? <button type="button" disabled={busy} onClick={() => void removePage()} className="inline-flex items-center gap-2 text-xs font-black text-red-700"><Trash2 className="h-4 w-4" /> Delete page</button> : null}</div> : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-black">Sections · {page?.title}</h2><p className="mt-1 text-xs text-slate-500">Select a section to move, remove, or edit its common content fields.</p></div><div className="flex gap-2"><select value={newSectionType} onChange={(e) => setNewSectionType(e.target.value as TenantSiteSectionType)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{SECTION_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}</select><button type="button" disabled={busy || !page} onClick={() => void addSection()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-black text-white disabled:opacity-40"><Plus className="h-4 w-4" /> Add section</button></div></div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[260px_1fr]">
                <div className="space-y-2">{page?.sections.map((section, index) => <button key={section.id} type="button" onClick={() => setSelectedSectionId(section.id)} className={`w-full rounded-xl border px-3 py-3 text-left text-sm ${selectedSection?.id === section.id ? 'border-indigo-300 bg-indigo-50 font-black text-indigo-950' : 'border-slate-200 bg-slate-50 font-bold text-slate-700'}`}><span>{index + 1}. {section.type.replaceAll('_', ' ')}</span></button>)}</div>

                {selectedSection ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-indigo-700">Selected section</p><h3 className="font-black capitalize">{selectedSection.type.replaceAll('_', ' ')}</h3></div><div className="flex gap-1"><button type="button" disabled={busy || selectedSectionIndex <= 0} onClick={() => void moveSection(-1)} className="rounded-lg border border-slate-300 bg-white p-2 disabled:opacity-30" aria-label="Move section up"><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={busy || selectedSectionIndex >= (page?.sections.length || 0) - 1} onClick={() => void moveSection(1)} className="rounded-lg border border-slate-300 bg-white p-2 disabled:opacity-30" aria-label="Move section down"><ArrowDown className="h-4 w-4" /></button><button type="button" disabled={busy} onClick={() => void removeSection()} className="rounded-lg border border-red-200 bg-white p-2 text-red-700" aria-label="Delete section"><Trash2 className="h-4 w-4" /></button></div></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2"><QuickField label="Title" value={fieldValues.title} onSave={(value) => updateSectionField('title', value)} /><QuickField label="Text" value={fieldValues.text} onSave={(value) => updateSectionField('text', value)} multiline /><QuickField label="Image URL" value={fieldValues.image} onSave={(value) => updateSectionField('image', value)} /><QuickField label="Image alt text" value={fieldValues.imageAlt} onSave={(value) => updateSectionField(selectedSection.type === 'image' ? 'alt' : 'imageAlt', value)} /><QuickField label="Button text" value={fieldValues.buttonText} onSave={(value) => updateSectionField('buttonText', value)} /><QuickField label="Button destination" value={fieldValues.buttonHref} onSave={(value) => updateSectionField('buttonHref', value)} /></div>
                </div> : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Select a section to edit it without code.</div>}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500"><Save className="h-4 w-4" /> Changes save through the same validated Website Builder API and revision system used by PARIS.</div>
        </details>
      </div>
    </section>
  );
}

function QuickField({ label, value, onSave, multiline = false }: { label: string; value: string; onSave: (value: string) => Promise<unknown>; multiline?: boolean }) {
  const [draft, setDraft] = useState(value);
  const common = { value: draft, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value), onBlur: () => { if (draft !== value) void onSave(draft); }, className: 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm' };
  return <label className="block"><span className="mb-1 block text-xs font-black text-slate-600">{label}</span>{multiline ? <textarea {...common} rows={4} /> : <input {...common} />}</label>;
}
