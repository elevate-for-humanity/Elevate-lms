'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

// All URL construction happens client-side — functions cannot cross the
// server/client boundary in Next.js App Router.

type Current = { q: string; category: string; wioa: boolean; provider: string };

function buildUrl(current: Current, overrides: Partial<{ q: string; category: string; wioa: string; provider: string; page: string }>) {
  const merged = {
    q: overrides.q !== undefined ? overrides.q : current.q,
    category: overrides.category !== undefined ? overrides.category : current.category,
    wioa: overrides.wioa !== undefined ? overrides.wioa : (current.wioa ? 'true' : ''),
    provider: overrides.provider !== undefined ? overrides.provider : current.provider,
    page: overrides.page ?? '1',
  };
  const sp = new URLSearchParams();
  if (merged.q) sp.set('q', merged.q);
  if (merged.category) sp.set('category', merged.category);
  if (merged.wioa === 'true') sp.set('wioa', 'true');
  if (merged.provider) sp.set('provider', merged.provider);
  if (merged.page && merged.page !== '1') sp.set('page', merged.page);
  const qs = sp.toString();
  return `/programs/catalog${qs ? `?${qs}` : ''}`;
}

export default function CatalogFilters({
  categories,
  current,
}: {
  categories: string[];
  current: Current;
}) {
  const router = useRouter();
  const go = useCallback((url: string) => router.push(url), [router]);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Search</label>
        <form onSubmit={e => {
          e.preventDefault();
          const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value;
          go(buildUrl(current, { q, page: '1' }));
        }}>
          <input
            name="q"
            defaultValue={current.q}
            placeholder="Program or credential…"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </form>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            checked={current.wioa}
            onChange={e => go(buildUrl(current, { wioa: e.target.checked ? 'true' : '', page: '1' }))}
            className="rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
          />
          WIOA Eligible Only
        </label>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Category</label>
        <div className="space-y-1">
          <button
            onClick={() => go(buildUrl(current, { category: '', page: '1' }))}
            className={`block w-full text-left text-sm px-2 py-1 rounded-lg transition ${
              !current.category ? 'bg-brand-blue-50 text-brand-blue-700 font-medium' : 'text-slate-600 hover:bg-white'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => go(buildUrl(current, { category: cat, page: '1' }))}
              className={`block w-full text-left text-sm px-2 py-1 rounded-lg transition ${
                current.category === cat ? 'bg-brand-blue-50 text-brand-blue-700 font-medium' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {(current.q || current.category || current.wioa || current.provider) && (
        <button
          onClick={() => go('/programs/catalog')}
          className="text-xs text-slate-400 hover:text-slate-600 transition"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
