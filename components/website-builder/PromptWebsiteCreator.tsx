'use client';

import { useState } from 'react';

/** One brief feeds the same validated, persisted production generator as the interview. */
export function PromptWebsiteCreator() {
  const [businessName, setBusinessName] = useState('');
  const [brief, setBrief] = useState('');
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
        body: JSON.stringify({ businessName: businessName.trim(), brief: brief.trim() }),
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
