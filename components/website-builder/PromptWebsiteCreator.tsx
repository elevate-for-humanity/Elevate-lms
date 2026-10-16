'use client';

import { useState } from 'react';

/** One brief feeds the same validated, persisted production generator as the interview. */
export function PromptWebsiteCreator() {
  const [businessName, setBusinessName] = useState('');
  const [brief, setBrief] = useState('');
  const [design, setDesign] = useState('executive');
  const designs = [
    { id: 'executive', name: 'Executive Luxury', colors: ['#123729','#c6a25e','#f7f1e5'], headline: 'A lasting legacy', note: 'Editorial photography, dark green, gold accents' },
    { id: 'modern', name: 'Modern Corporate', colors: ['#173e5a','#e6f0f5','#ffffff'], headline: 'Build what is next', note: 'Clean grids, strong contrast, professional imagery' },
    { id: 'creative', name: 'Bold Creative', colors: ['#442080','#f1b742','#f9eaf3'], headline: 'Make an impact', note: 'Expressive headlines, vivid imagery, dynamic sections' },
    { id: 'minimal', name: 'Elegant Minimalist', colors: ['#242424','#d9cdb8','#faf9f6'], headline: 'Designed to endure', note: 'Refined type, calm photography, generous whitespace' },
  ] as const;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/apps/website-builder/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: businessName.trim(), brief: brief.trim(), designDirection: design }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Your website could not be generated.');
      if (
        !data.website?.id ||
        !data.generated ||
        !data.editUrl?.startsWith('/apps/website-builder/edit/')
      ) {
        throw new Error('The website was not saved. Please retry.');
      }
      window.location.assign(data.editUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your website could not be generated.');
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={generate}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-2xl font-black text-slate-950">Describe it. See your website.</h2>
      <p className="mt-2 max-w-3xl leading-7 text-slate-600">
        Tell PARIS about your business, what visitors should do, and the style you want. Get a saved
        draft, preview it on any screen, then keep editing by typing what to change.
      </p>
      <label className="mt-6 block font-bold text-slate-900" htmlFor="website-business-name">
        Business or website name
      </label>
      <input
        id="website-business-name"
        value={businessName}
        onChange={(event) => setBusinessName(event.target.value)}
        required
        maxLength={120}
        disabled={busy}
        className="mt-2 w-full rounded-xl border border-slate-300 p-3"
        autoComplete="organization"
      />
      <label className="mt-5 block font-bold text-slate-900" htmlFor="website-business-brief">
        What should your website do?
      </label>
      <textarea
        id="website-business-brief"
        value={brief}
        onChange={(event) => setBrief(event.target.value)}
        required
        minLength={40}
        maxLength={12000}
        rows={6}
        disabled={busy}
        className="mt-2 w-full rounded-xl border border-slate-300 p-3"
        placeholder="Describe your products or services, customers, brand style, pages and contact details. Include the real images and payment destinations you want to use."
      />
      <fieldset className="mt-7">
        <legend className="text-lg font-bold text-slate-950">Choose your visual direction</legend>
        <p className="mt-1 text-sm text-slate-600">Preview a design direction before PARIS generates your pages. You can request changes later.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {designs.map(item => <label key={item.id} className={`cursor-pointer overflow-hidden rounded-2xl border-2 transition ${design === item.id ? 'border-brand-red-600 ring-2 ring-brand-red-100' : 'border-slate-200'}`}>
            <input type="radio" name="design-direction" value={item.id} checked={design === item.id} onChange={() => setDesign(item.id)} className="sr-only" />
            <div className="flex h-36 flex-col justify-between p-5" style={{ background: item.colors[0], color: item.colors[2] }}>
              <div className="flex gap-1.5">{item.colors.map(color => <span key={color} className="h-3 w-3 rounded-full border border-white/30" style={{backgroundColor:color}} />)}</div>
              <div><div className="h-1 w-12 rounded-full" style={{backgroundColor:item.colors[1]}} /><p className="mt-3 max-w-[200px] font-serif text-2xl leading-tight">{item.headline}</p></div>
            </div>
            <div className="bg-white p-4"><p className="font-bold text-slate-950">{item.name} {design === item.id ? '✓' : ''}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.note}</p></div>
          </label>)}
        </div>
      </fieldset>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Use your real business details. Prices, payment accounts and customer policies need your
        review before publishing.
      </p>
      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 font-semibold text-red-800">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-5 min-h-12 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-60"
      >
        {busy ? 'Creating and saving your draft…' : 'Create my website'}
      </button>
      {busy ? (
        <p role="status" className="mt-3 text-sm text-slate-600">
          PARIS is generating your pages and checking the draft. Keep this window open.
        </p>
      ) : null}
    </form>
  );
}
