'use client';

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

function GlobalSearchContent() {
  const router = useRouter();
  const searchParams = useSafeSearchParams();
  const initial = searchParams?.get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const supabase = createClient();

  // Log search and get suggestions
  async function logSearch(searchQuery: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Log search to history
    await supabase.from('search_history').insert({
      user_id: user?.id,
      query: searchQuery,
      search_type: 'global',
      searched_at: new Date().toISOString(),
    });

    // Update search analytics
    await supabase.rpc('increment_search_count', { search_query: searchQuery });
  }

  // Load search suggestions from DB + search index
  useEffect(() => {
    async function loadSuggestions() {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      // Fetch from both Supabase suggestions and the search API
      const [dbResult, apiResult] = await Promise.all([
        supabase
          .from('search_suggestions')
          .select('suggestion')
          .ilike('suggestion', `%${query}%`)
          .limit(3),
        fetch(`/api/search?q=${encodeURIComponent(query)}&limit=3&source=index`)
          .then((r) => r.json())
          .catch(() => ({ results: [] })),
      ]);

      const dbSuggestions = (dbResult.data || []).map((s: any) => s.suggestion);
      const indexSuggestions = (apiResult.results || []).map((r: any) => r.title);
      const merged = [...new Set([...dbSuggestions, ...indexSuggestions])].slice(0, 5);
      setSuggestions(merged);
    }
    const debounce = setTimeout(loadSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query, supabase]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push('/lms/courses');
      return;
    }
    logSearch(q);
    router.push(`/lms/courses?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    setQuery(initial);
  }, [initial]);

  return (
    <form onSubmit={onSubmit} className="relative flex min-w-0 w-full max-w-2xl items-center">
      <div className="relative min-w-0 w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 sm:left-4" />
        <input
          type="search"
          className="min-h-11 min-w-0 w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm shadow-card transition-all focus:border-accent-500 focus:outline-none focus:ring-4 focus:ring-accent-100 sm:py-4 sm:pl-12 sm:pr-32 md:text-base"
          placeholder="Search programs, courses, or topics…"
          value={query}
          onChange={(
            e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
          ) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-1 top-1/2 inline-flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-full bg-accent-500 px-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-accent-600 active:scale-95 sm:right-2 sm:px-6 sm:py-2"
        >
          <Search className="h-4 w-4 sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </form>
  );
}

export function GlobalSearch() {
  return (
          <GlobalSearchContent />
  );
}
