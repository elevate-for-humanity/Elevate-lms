'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import type { CommerceCatalogItem, CommerceCategory } from '@/lib/store/commerce-catalog';

const CATEGORY_LABELS: Record<'all' | CommerceCategory, string> = {
  all: 'All',
  platform: 'Platform Plans',
  app: 'Apps',
  ai: 'AI',
  education: 'Education',
  workforce: 'Workforce',
  operations: 'Operations',
  enterprise: 'Enterprise',
};

export default function CommerceCatalogClient({ items }: { items: CommerceCatalogItem[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | CommerceCategory>('all');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!needle) return true;
      return [item.name, item.description, item.category, ...item.keywords]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [items, query, category]);

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label htmlFor="store-search" className="sr-only">
          Search Elevate Store
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="store-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search website builder, AI assistants, LMS, testing, workforce, grants..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-base text-slate-900 outline-none ring-brand-red-500 focus:ring-2"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Store categories">
          {(Object.keys(CATEGORY_LABELS) as Array<'all' | CommerceCategory>).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                category === key
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </p>
        {(query || category !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('all');
            }}
            className="text-sm font-semibold text-brand-red-700 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <h2 className="text-xl font-bold text-slate-900">No matching Store item</h2>
          <p className="mt-2 text-slate-600">Try a broader feature, product, or category name.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                  {CATEGORY_LABELS[item.category]}
                </span>
                {item.status === 'preview' && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Preview</span>
                )}
                {item.status === 'enterprise' && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">Enterprise</span>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-900">{item.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-3 text-sm font-bold text-slate-900">
                  {item.priceLabel ?? (item.billingType === 'included' ? 'Included' : 'See details')}
                </div>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 font-bold text-brand-red-700 hover:underline"
                >
                  {item.status === 'sellable' ? 'View plans' : item.status === 'preview' ? 'Explore preview' : 'Explore options'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
