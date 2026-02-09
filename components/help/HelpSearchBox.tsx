"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';
// components/help/HelpSearchBox.tsx

import { useState } from 'react';
import Link from 'next/link';

type Result = {
  id: string;
  slug: string;
  title: string;
  category: string;
  audience: string;
  snippet: string;
};

export function HelpSearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Log help search to DB
  const logHelpSearch = async (searchQuery: string, resultCount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('help_search_log')
      .insert({
        user_id: user?.id,
        query: searchQuery,
        result_count: resultCount,
        searched_at: new Date().toISOString()
      });
  };

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/help/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
      await logHelpSearch(query.trim(), data.results?.length || 0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSearch} className="mb-3 w-full max-w-xl mx-auto">
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setQuery(e.target.value)}
            placeholder='Search help articles (e.g. "barber apprenticeship attendance")'
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
          <button
            type="submit"
            className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="mx-auto mt-4 max-w-3xl space-y-2 text-left">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/help/${r.slug}`}
              className="block rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm hover:border-orange-500 hover:bg-orange-50"
            >
              <p className="font-semibold text-black">{r.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {r.category} • {r.audience}
              </p>
              <p className="mt-1 text-xs text-black">
                {r.snippet}...
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
